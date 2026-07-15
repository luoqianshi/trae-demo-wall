// 错题大作战 - 游戏引擎
// 包含：飞机大战、一站到底、寻宝冒险 三款游戏
// 依赖：APP_DATA, appState（来自主文件）

const GameEngine = {
  // ==========================================
  //  飞机大战
  // ==========================================
  plane: {
    canvas: null, ctx: null,
    state: 'menu', // menu, playing, shooting, hit, damage, gameover
    animId: null,
    score: 0, lives: 3, wave: 1,
    player: { x: 0, y: 0, w: 48, h: 48 },
    enemies: [], bullets: [], particles: [], floatTexts: [],
    stars: [],
    currentQuestion: null, selectedAnswer: null,
    onEnd: null,

    init(canvasEl, questions, onEnd) {
      this.canvas = canvasEl;
      this.ctx = canvasEl.getContext('2d');
      this.questions = questions || [];
      this.onEnd = onEnd || (() => {});
      this.score = 0; this.lives = 3; this.wave = 1;
      this.enemies = []; this.bullets = []; this.particles = []; this.floatTexts = [];
      this.state = 'playing'; this.selectedAnswer = null;
      this.stars = [];
      for (let i = 0; i < 120; i++) {
        this.stars.push({ x: Math.random()*canvasEl.width, y: Math.random()*canvasEl.height, s: 0.5+Math.random()*2, speed: 0.2+Math.random()*0.8, o: 0.3+Math.random()*0.7 });
      }
      this.player.x = canvasEl.width / 2 - 24;
      this.player.y = canvasEl.height - 100;
      this.spawnEnemy();
      this.bindInput();
      this.loop();
    },

    bindInput() {
      const c = this.canvas;
      const move = (e) => {
        const rect = c.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        this.player.x = Math.max(0, Math.min(c.width - this.player.w, clientX - rect.left - this.player.w/2));
      };
      c.addEventListener('mousemove', move);
      c.addEventListener('touchmove', (e) => { e.preventDefault(); move(e); }, { passive: false });
      this._cleanup = () => { c.removeEventListener('mousemove', move); };
    },

    spawnEnemy() {
      if (this.questions.length === 0) { this.state = 'gameover'; return; }
      const q = this.questions[this.score % this.questions.length];
      this.currentQuestion = q;
      this.enemies.push({
        x: 30 + Math.random() * (this.canvas.width - 90),
        y: -80, w: 70, h: 50, speed: 0.5 + this.wave * 0.15,
        text: q.content.substring(0, 12) + '…', question: q, hit: false
      });
    },

    shoot() {
      if (this.state !== 'playing' || !this.currentQuestion) return;
      this.bullets.push({ x: this.player.x + this.player.w/2 - 3, y: this.player.y - 10, w: 6, h: 16, speed: 8 });
      this.state = 'shooting';
    },

    checkCollision(b, e) {
      return b.x < e.x+e.w && b.x+b.w > e.x && b.y < e.y+e.h && b.y+b.h > e.y;
    },

    answer(option) {
      if (this.state !== 'playing') return;
      this.selectedAnswer = option;
      if (option === this.currentQuestion.answer) {
        this.shoot();
      } else {
        this.lives--;
        this.state = 'damage';
        setTimeout(() => {
          if (this.lives <= 0) { this.endGame(); }
          else { this.spawnEnemy(); this.state = 'playing'; }
        }, 600);
      }
    },

    addExplosion(x, y, color) {
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        this.particles.push({ x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, life: 1, color, size: 2+Math.random()*4 });
      }
    },

    addFloatText(x, y, text, color) {
      this.floatTexts.push({ x, y, text, color, life: 1, vy: -2 });
    },

    endGame() {
      this.state = 'gameover';
      if (this.onEnd) this.onEnd({ score: this.score, wave: this.wave });
    },

    update() {
      // Stars
      this.stars.forEach(s => { s.y += s.speed; if (s.y > this.canvas.height) { s.y = 0; s.x = Math.random()*this.canvas.width; }});
      if (this.state === 'menu' || this.state === 'gameover') return;
      // Bullets
      this.bullets.forEach(b => b.y -= b.speed);
      this.bullets = this.bullets.filter(b => b.y > -20);
      // Enemies
      this.enemies.forEach(e => { if (!e.hit) e.y += e.speed; });
      // Collision
      if (this.state === 'shooting') {
        const bullet = this.bullets[0];
        const enemy = this.enemies.find(e => !e.hit);
        if (bullet && enemy && this.checkCollision(bullet, enemy)) {
          enemy.hit = true;
          this.bullets = [];
          this.addExplosion(enemy.x + enemy.w/2, enemy.y + enemy.h/2, '#FFD93D');
          this.score += 10;
          this.addFloatText(enemy.x + enemy.w/2, enemy.y, '+10', '#FFD93D');
          this.wave = Math.floor(this.score / 50) + 1;
          setTimeout(() => {
            this.enemies = this.enemies.filter(e => !e.hit);
            this.spawnEnemy();
            this.state = 'playing';
            this.selectedAnswer = null;
          }, 400);
        }
        // Bullet missed
        if (bullet && bullet.y < -10) {
          this.bullets = [];
          this.state = 'playing';
        }
      }
      // Enemy reaches bottom
      this.enemies.forEach(e => {
        if (!e.hit && e.y > this.canvas.height - 60) {
          e.hit = true;
          this.lives--;
          this.addExplosion(e.x+e.w/2, e.y+e.h/2, '#FF6B6B');
          if (this.lives <= 0) this.endGame();
          else {
            setTimeout(() => { this.enemies = this.enemies.filter(x => !x.hit); this.spawnEnemy(); }, 300);
          }
        }
      });
      // Particles
      this.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.02; p.vy += 0.05; });
      this.particles = this.particles.filter(p => p.life > 0);
      // Float texts
      this.floatTexts.forEach(t => { t.y += t.vy; t.life -= 0.02; });
      this.floatTexts = this.floatTexts.filter(t => t.life > 0);
    },

    render() {
      const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
      // Background
      ctx.fillStyle = '#0B0E2D';
      ctx.fillRect(0, 0, W, H);
      // Stars
      this.stars.forEach(s => { ctx.globalAlpha = s.o; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.s, 0, Math.PI*2); ctx.fill(); });
      ctx.globalAlpha = 1;
      // Enemies
      this.enemies.forEach(e => {
        if (e.hit) return;
        ctx.save();
        ctx.fillStyle = 'rgba(255,107,107,.15)';
        ctx.strokeStyle = '#FF6B6B';
        ctx.lineWidth = 2;
        const r = 12;
        ctx.beginPath();
        ctx.moveTo(e.x+r, e.y); ctx.lineTo(e.x+e.w-r, e.y); ctx.quadraticCurveTo(e.x+e.w, e.y, e.x+e.w, e.y+r);
        ctx.lineTo(e.x+e.w, e.y+e.h-r); ctx.quadraticCurveTo(e.x+e.w, e.y+e.h, e.x+e.w-r, e.y+e.h);
        ctx.lineTo(e.x+r, e.y+e.h); ctx.quadraticCurveTo(e.x, e.y+e.h, e.x, e.y+e.h-r);
        ctx.lineTo(e.x, e.y+r); ctx.quadraticCurveTo(e.x, e.y, e.x+r, e.y);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FF6B6B'; ctx.font = '11px "Noto Sans SC"'; ctx.textAlign = 'center';
        ctx.fillText(e.text, e.x+e.w/2, e.y+e.h/2+4);
        ctx.restore();
      });
      // Bullets
      this.bullets.forEach(b => {
        ctx.save();
        const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y+b.h);
        grad.addColorStop(0, '#FFD93D'); grad.addColorStop(1, '#FF9F43');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.ellipse(b.x+b.w/2, b.y+b.h/2, b.w/2, b.h/2, 0, 0, Math.PI*2); ctx.fill();
        // Glow
        ctx.shadowColor = '#FFD93D'; ctx.shadowBlur = 12;
        ctx.fill();
        ctx.restore();
      });
      // Particles
      this.particles.forEach(p => {
        ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      // Float texts
      this.floatTexts.forEach(t => {
        ctx.globalAlpha = t.life; ctx.fillStyle = t.color;
        ctx.font = 'bold 20px "Fredoka One"'; ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
      });
      ctx.globalAlpha = 1;
      // Player (橡皮侠飞船)
      if (this.state !== 'gameover') {
        ctx.save();
        ctx.translate(this.player.x + this.player.w/2, this.player.y + this.player.h/2);
        // Body
        ctx.fillStyle = 'rgba(77,124,255,.2)'; ctx.strokeStyle = '#4D7CFF'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(20, 16); ctx.lineTo(12, 20); ctx.lineTo(0, 12); ctx.lineTo(-12, 20); ctx.lineTo(-20, 16); ctx.closePath();
        ctx.fill(); ctx.stroke();
        // Flame
        ctx.fillStyle = '#FF9F43'; ctx.globalAlpha = 0.6 + Math.random()*0.4;
        ctx.beginPath(); ctx.moveTo(-8, 20); ctx.lineTo(0, 32+Math.random()*8); ctx.lineTo(8, 20); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
        // Window
        ctx.fillStyle = '#FFD93D'; ctx.beginPath(); ctx.arc(0, -4, 6, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      }
      // HUD
      ctx.fillStyle = '#fff'; ctx.font = 'bold 16px "Fredoka One"'; ctx.textAlign = 'left';
      ctx.fillText('SCORE: ' + this.score, 16, 32);
      ctx.textAlign = 'right';
      ctx.fillText('WAVE ' + this.wave, W-16, 32);
      // Lives
      ctx.textAlign = 'left';
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i < this.lives ? '#FF6B6B' : 'rgba(255,255,255,.15)';
        ctx.font = '18px sans-serif';
        ctx.fillText('♥', 16 + i * 24, 58);
      }
      // Game Over
      if (this.state === 'gameover') {
        ctx.fillStyle = 'rgba(11,14,45,.7)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#FFD93D'; ctx.font = 'bold 32px "ZCOOL KuaiLe"'; ctx.textAlign = 'center';
        ctx.fillText('游戏结束！', W/2, H/2 - 30);
        ctx.fillStyle = '#fff'; ctx.font = '20px "Fredoka One"';
        ctx.fillText('SCORE: ' + this.score, W/2, H/2 + 10);
        ctx.fillStyle = '#4D7CFF'; ctx.font = '16px "Noto Sans SC"';
        ctx.fillText('消灭了 ' + this.score/10 + ' 道错题', W/2, H/2 + 40);
      }
    },

    loop() {
      this.update();
      this.render();
      this.animId = requestAnimationFrame(() => this.loop());
    },

    destroy() {
      if (this.animId) cancelAnimationFrame(this.animId);
      if (this._cleanup) this._cleanup();
      this.canvas.width = this.canvas.width; // Clear
    }
  },

  // ==========================================
  //  一站到底
  // ==========================================
  quiz: {
    questions: [], currentIndex: 0, score: 0, combo: 0, maxCombo: 0,
    timer: null, timeLeft: 15, timerInterval: null,
    isAnswering: false, onEnd: null,
    correctCount: 0,

    init(questions, onEnd) {
      this.questions = this.shuffle([...questions]);
      this.currentIndex = 0; this.score = 0; this.combo = 0; this.maxCombo = 0;
      this.correctCount = 0; this.isAnswering = false;
      this.onEnd = onEnd || (() => {});
      return this.getNextQuestion();
    },

    getNextQuestion() {
      if (this.currentIndex >= this.questions.length) return null;
      return this.questions[this.currentIndex];
    },

    answer(option) {
      if (this.isAnswering) return;
      this.isAnswering = true;
      const q = this.questions[this.currentIndex];
      const isCorrect = option === q.answer;
      if (isCorrect) {
        this.correctCount++;
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        const bonus = Math.min(this.combo, 5);
        this.score += 10 + bonus * 2;
      } else {
        this.combo = 0;
      }
      this.stopTimer();
      this.currentIndex++;
      return { isCorrect, correctAnswer: q.answer, score: this.score, combo: this.combo, finished: this.currentIndex >= this.questions.length };
    },

    startTimer(onTick, onTimeout) {
      this.timeLeft = 15;
      this.stopTimer();
      this.timerInterval = setInterval(() => {
        this.timeLeft--;
        if (onTick) onTick(this.timeLeft);
        if (this.timeLeft <= 0) {
          this.stopTimer();
          this.combo = 0;
          this.currentIndex++;
          if (onTimeout) onTimeout();
        }
      }, 1000);
    },

    stopTimer() {
      if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
    },

    getStats() {
      return { score: this.score, correct: this.correctCount, total: this.questions.length, maxCombo: this.maxCombo };
    },

    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
      return arr;
    }
  },

  // ==========================================
  //  寻宝冒险
  // ==========================================
  treasure: {
    questions: [], currentNode: 0, score: 0, fragments: 0, totalFragments: 8,
    onEnd: null, mapNodes: [],

    init(questions, onEnd) {
      this.questions = questions.slice(0, 8);
      this.currentNode = 0; this.score = 0; this.fragments = 0;
      this.onEnd = onEnd || (() => {});
      this.mapNodes = this.questions.map((q, i) => ({
        id: i, question: q, answered: false, correct: false,
        x: 50 + (i % 4) * 22, y: i < 4 ? 25 : 65
      }));
      return this.mapNodes;
    },

    answer(nodeId, option) {
      const node = this.mapNodes[nodeId];
      if (!node || node.answered) return null;
      const isCorrect = option === node.question.answer;
      node.answered = true;
      node.correct = isCorrect;
      if (isCorrect) {
        this.score += 15;
        this.fragments++;
      }
      const nextNode = this.mapNodes.find(n => !n.answered);
      return { isCorrect, correctAnswer: node.question.answer, score: this.score, fragments: this.fragments, nextNodeId: nextNode ? nextNode.id : null, finished: !nextNode };
    },

    getCurrentQuestion() {
      const node = this.mapNodes[this.currentNode];
      return node && !node.answered ? node.question : null;
    },

    getStats() {
      return { score: this.score, fragments: this.fragments, total: this.totalFragments, answered: this.mapNodes.filter(n => n.answered).length, correct: this.mapNodes.filter(n => n.correct).length };
    }
  }
};