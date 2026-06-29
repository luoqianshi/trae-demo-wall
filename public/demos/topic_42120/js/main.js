import { CharLibrary } from './core/char-library.js';
import { Brush } from './core/brush.js';
import { Monster } from './core/monster.js';
import { StrokeRecognizer } from './core/stroke-recognizer.js';
import { BattleSystem } from './systems/battle.js';
import { LevelSystem } from './systems/level.js';
import { ItemSystem } from './systems/items.js';
import { DrawModal } from './ui/draw-modal.js';
import { HUD } from './ui/hud.js';
import { ResultPanel } from './ui/result-panel.js';
import { InkParticles } from './fx/ink-particles.js';
import { AudioSystem } from './fx/audio.js';
import { i18n } from './i18n.js';

class InkBattle {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.charLibrary = new CharLibrary();
    this.brush = new Brush(this);
    this.strokeRecognizer = new StrokeRecognizer();
    this.inkParticles = new InkParticles(this);
    this.audio = new AudioSystem();
    this.itemSystem = new ItemSystem(this);
    this.levelSystem = new LevelSystem(this);
    this.battleSystem = new BattleSystem(this);
    
    this.drawModal = new DrawModal(this);
    this.hud = new HUD(this);
    this.resultPanel = new ResultPanel(this);

    this.state = 'START';
    this.lastTime = 0;
    this.monsters = [];
    this.particles = [];
    this.floatTexts = [];
    
    this.score = 0;
    this.hp = 3;
    this.maxHp = 3;
    this.timer = 20;
    this.level = 1;
    this.collectedRadicals = [];
    this.currentChar = null;
    this.collectedChars = [];
    
    this.charLibrary.loadChars();
    this.bindEvents();
    this.gameLoop(0);
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
  }

  bindEvents() {
    document.getElementById('start-btn').addEventListener('click', () => this.startGame());
    document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
    document.getElementById('next-level-btn').addEventListener('click', () => this.nextLevel());
    
    document.querySelectorAll('.lang-label').forEach(label => {
      label.addEventListener('click', (e) => {
        const lang = e.target.dataset.lang;
        i18n.setLanguage(lang);
        document.querySelectorAll('.lang-label').forEach(l => l.classList.remove('active'));
        e.target.classList.add('active');
        this.updateUIText();
      });
    });

    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
    
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
  }

  updateUIText() {
    document.getElementById('start-btn').textContent = i18n.get('start');
    document.querySelector('#start-screen .subtitle').textContent = i18n.currentLang === 'zh' ? '执笔破妖，识字通关' : 'Draw to defeat, learn to win';
    document.getElementById('restart-btn').textContent = i18n.get('restart');
    document.getElementById('next-level-btn').textContent = i18n.get('nextLevel');
    
    document.querySelector('.hp-label').textContent = i18n.get('hp');
    document.querySelector('.score-label').textContent = i18n.get('score');
    document.querySelector('#radical-collector .collector-title').textContent = i18n.get('radicals');
    
    document.getElementById('result-title').textContent = i18n.get('victory');
    document.getElementById('result-label-level').textContent = i18n.get('level');
    document.getElementById('result-label-score').textContent = i18n.get('score');
    document.getElementById('result-label-char').textContent = i18n.get('radicals');
    document.getElementById('result-collected-label').textContent = i18n.get('collected');
    document.querySelector('.reward-section .reward-label').textContent = i18n.get('reward');
    
    document.querySelector('#game-over .game-over-title').textContent = i18n.get('gameOver');
    document.querySelector('#game-over .final-label').textContent = i18n.get('finalScore');
    document.querySelector('#game-over .collected-label').textContent = i18n.get('collectedChars');
    
    document.getElementById('draw-cancel').textContent = i18n.get('cancel');
    document.getElementById('draw-submit').textContent = i18n.get('confirm');
    
    document.querySelector('#boss-merge .merge-text').textContent = i18n.currentLang === 'zh' ? 'BOSS 合体!' : 'BOSS Merge!';
  }

  handleMouseMove(e) {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    this.brush.update(e.clientX, e.clientY, false);
  }

  handleMouseDown(e) {
    this.brush.update(e.clientX, e.clientY, true);
    this.handleCanvasClick(e.clientX, e.clientY);
  }

  handleMouseUp(e) {
    this.brush.update(e.clientX, e.clientY, false);
  }

  handleCanvasClick(x, y) {
    if (this.state !== 'PLAYING') return;
    
    this.monsters.forEach(monster => {
      if (monster.weaknessActive && monster.isClicked(x, y)) {
        this.showDrawModal(monster.radical, monster);
        monster.deactivateWeakness();
      }
    });
  }

  handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.mouseX = touch.clientX;
    this.mouseY = touch.clientY;
    this.brush.update(touch.clientX, touch.clientY, true);
  }

  handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.mouseX = touch.clientX;
    this.mouseY = touch.clientY;
    this.brush.update(touch.clientX, touch.clientY, true);
  }

  handleTouchEnd(e) {
    e.preventDefault();
    if (this.mouseX && this.mouseY) {
      this.brush.update(this.mouseX, this.mouseY, false);
    }
  }

  startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    this.state = 'PLAYING';
    this.levelSystem.startLevel(this.level);
    this.audio.playStart();
  }

  restartGame() {
    document.getElementById('game-over').classList.add('hidden');
    this.state = 'PLAYING';
    this.level = 1;
    this.score = 0;
    this.hp = this.maxHp;
    this.collectedChars = [];
    this.collectedRadicals = [];
    this.monsters = [];
    this.particles = [];
    this.itemSystem.clear();
    this.levelSystem.startLevel(this.level);
    this.hud.update();
    this.audio.playStart();
  }

  nextLevel() {
    document.getElementById('result-panel').classList.add('hidden');
    this.level++;
    this.collectedRadicals = [];
    this.monsters = [];
    this.particles = [];
    this.state = 'PLAYING';
    this.levelSystem.startLevel(this.level);
    this.hud.update();
    this.audio.playStart();
    console.log('Next level started:', this.level, 'state:', this.state);
  }

  addMonster(x, y, radical, isBoss = false) {
    const monster = new Monster(this, x, y, radical, isBoss);
    this.monsters.push(monster);
    return monster;
  }

  removeMonster(monster) {
    const index = this.monsters.indexOf(monster);
    if (index !== -1) {
      this.monsters.splice(index, 1);
      this.inkParticles.createExplosion(monster.x, monster.y);
      this.audio.playHit();
    }
  }

  collectRadical(radical) {
    if (!this.collectedRadicals.includes(radical)) {
      this.collectedRadicals.push(radical);
      this.hud.updateRadicals();
      this.audio.playCollect();
      
      if (this.collectedRadicals.length >= this.currentChar.radicals.length) {
        this.triggerBoss();
      }
    }
  }

  triggerBoss() {
    this.state = 'BOSS_MERGE';
    document.getElementById('char-reveal').textContent = this.currentChar.char;
    document.getElementById('boss-merge').classList.remove('hidden');
    this.audio.playBossEnter();
    
    setTimeout(() => {
      document.getElementById('boss-merge').classList.add('hidden');
      this.state = 'PLAYING';
      this.spawnBoss();
    }, 2500);
  }

  spawnBoss() {
    const char = this.currentChar;
    const boss = this.addMonster(this.centerX, this.centerY, char.char, true);
    boss.targetStrokeCount = char.radicals.length;
    boss.hp = this.itemSystem.hasItem('weaken') ? 1 : 2;
  }

  takeDamage() {
    this.hp--;
    this.hud.updateHP();
    this.audio.playDamage();
    
    if (this.hp <= 0) {
      this.gameOver();
    }
  }

  gameOver() {
    this.state = 'GAME_OVER';
    document.getElementById('game-over').classList.remove('hidden');
    document.querySelector('.final-value').textContent = this.score;
    
    const collectedList = document.querySelector('.collected-list');
    collectedList.innerHTML = '';
    this.collectedChars.forEach(char => {
      const span = document.createElement('span');
      span.className = 'collected-char';
      span.textContent = char;
      collectedList.appendChild(span);
    });
    
    this.audio.playGameOver();
  }

  showDrawModal(radical, monster) {
    this.state = 'DRAW_MODAL';
    this.currentDrawingMonster = monster;
    this.drawModal.show(radical, monster);
  }

  onDrawComplete(success) {
    this.state = 'PLAYING';
    this.drawModal.hide();
    
    if (success) {
      if (this.currentDrawingMonster) {
        this.score += this.currentDrawingMonster.isBoss ? 100 : 10;
        this.hud.updateScore();
        
        if (this.currentDrawingMonster.isBoss) {
          this.currentDrawingMonster.hp--;
          if (this.currentDrawingMonster.hp <= 0) {
            this.removeMonster(this.currentDrawingMonster);
            this.collectedChars.push(this.currentChar.char);
            this.showResult();
          }
        } else {
          this.collectRadical(this.currentDrawingMonster.radical);
          this.removeMonster(this.currentDrawingMonster);
        }
      }
    } else {
      this.takeDamage();
      this.showDamagePopup('描摹失败!');
    }
  }

  showResult() {
    this.state = 'RESULT';
    const panel = document.getElementById('result-panel');
    const levelEl = document.getElementById('result-level');
    const scoreEl = document.getElementById('result-score');
    const charEl = document.getElementById('result-char');
    const collectedList = document.getElementById('collected-chars-result');
    const rewardItemEl = document.getElementById('reward-item');
    
    if (!panel || !levelEl || !scoreEl || !charEl) {
      console.error('Result panel elements not found');
      return;
    }
    
    panel.classList.remove('hidden');
    levelEl.textContent = `第 ${this.level} 关`;
    scoreEl.textContent = this.score;
    charEl.textContent = this.currentChar ? this.currentChar.char : '?';
    
    if (collectedList) {
      collectedList.innerHTML = '';
      this.collectedChars.forEach(char => {
        const span = document.createElement('span');
        span.className = 'collected-char';
        span.textContent = char;
        collectedList.appendChild(span);
      });
    }
    
    const reward = this.itemSystem.getRandomReward();
    if (rewardItemEl) {
      rewardItemEl.textContent = reward.icon;
    }
    
    if (this.itemSystem.canAddItem(reward.id)) {
      this.itemSystem.addItem(reward.id);
    }
    
    this.audio.playVictory();
  }

  updateTimer(deltaTime) {
    if (this.state !== 'PLAYING') return;
    
    this.timer -= deltaTime;
    if (this.timer <= 0) {
      this.timer = 20;
      this.takeDamage();
      this.showDamagePopup('时间耗尽!');
    }
    this.hud.updateTimer();
  }

  showDamagePopup(text) {
    const popup = document.getElementById('damage-popup');
    popup.textContent = text;
    popup.style.display = 'block';
    setTimeout(() => {
      popup.style.display = 'none';
    }, 1000);
  }

  update(deltaTime) {
    if (this.state !== 'PLAYING') return;
    
    this.updateTimer(deltaTime);
    this.battleSystem.update(deltaTime);
    this.brush.update(deltaTime);
    this.inkParticles.update(deltaTime);
    
    this.monsters.forEach(monster => monster.update(deltaTime));
    
    this.floatTexts = this.floatTexts.filter(text => {
      text.y -= 2;
      text.alpha -= 0.02;
      return text.alpha > 0;
    });
  }

  draw() {
    this.drawBackground();
    this.drawMonsters();
    this.drawParticles();
    this.drawFloatTexts();
    this.brush.draw();
  }

  drawBackground() {
    const ctx = this.ctx;
    ctx.fillStyle = '#f5f0e8';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawMonsters() {
    if (this.monsters.length > 0) {
      this.monsters.forEach(monster => monster.draw());
    }
  }

  drawParticles() {
    this.particles.forEach(particle => {
      this.ctx.fillStyle = `rgba(44, 44, 44, ${particle.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  drawFloatTexts() {
    this.floatTexts.forEach(text => {
      this.ctx.save();
      this.ctx.globalAlpha = text.alpha;
      this.ctx.fillStyle = text.color;
      this.ctx.font = 'bold 24px "Ma Shan Zheng", "KaiTi", serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(text.text, text.x, text.y);
      this.ctx.restore();
    });
  }

  gameLoop(currentTime) {
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    this.update(deltaTime);
    this.draw();
    
    requestAnimationFrame((time) => this.gameLoop(time));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new InkBattle();
});