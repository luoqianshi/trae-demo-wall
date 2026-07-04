import { i18n } from '../i18n.js';

export class DrawModal {
  constructor(game) {
    this.game = game;
    this.canvas = document.getElementById('draw-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = 300;
    this.canvas.height = 300;
    
    this.isDrawing = false;
    this.strokePoints = [];
    this.targetRadical = '';
    this.currentMonster = null;
    this.hasWritten = false;
    this.timeout = null;
    this.strokeCount = 0;
    this.lastPoint = null;
    
    this.bindEvents();
  }

  bindEvents() {
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseleave', () => this.stopDrawing());
    
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    this.canvas.addEventListener('touchend', () => this.stopDrawing());
    
    document.getElementById('draw-cancel').addEventListener('click', () => this.cancel());
    document.getElementById('draw-submit').addEventListener('click', () => this.submit());
  }

  show(radical, monster) {
    this.targetRadical = radical;
    this.currentMonster = monster;
    document.getElementById('target-radical').textContent = radical;
    
    const isBoss = monster.isBoss;
    const hint = isBoss 
      ? (i18n.currentLang === 'zh' 
        ? `请描摹 ${radical} (笔画数: ${monster.targetStrokeCount})` 
        : `Draw ${radical} (strokes: ${monster.targetStrokeCount})`)
      : (i18n.currentLang === 'zh' ? '请描摹部首' : 'Draw the radical');
    document.querySelector('.draw-hint').textContent = hint;
    
    document.getElementById('draw-modal').classList.remove('hidden');
    this.clearCanvas();
    this.strokePoints = [];
    this.hasWritten = false;
    this.strokeCount = 0;
    this.lastPoint = null;
    
    clearTimeout(this.timeout);
    const timeoutDuration = isBoss ? 10000 : 5000;
    this.timeout = setTimeout(() => {
      if (!this.hasWritten) {
        this.cancel();
      }
    }, timeoutDuration);
  }

  hide() {
    document.getElementById('draw-modal').classList.add('hidden');
    this.clearCanvas();
    this.strokePoints = [];
    clearTimeout(this.timeout);
  }

  clearCanvas() {
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(50, 50, 200, 200);
    this.ctx.setLineDash([]);
  }

  startDrawing(e) {
    this.isDrawing = true;
    this.strokePoints = [];
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.strokePoints.push({ x, y });
    
    if (this.lastPoint) {
      this.strokeCount++;
    }
    this.lastPoint = { x, y };
    this.hasWritten = true;
  }

  draw(e) {
    if (!this.isDrawing) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.strokePoints.push({ x, y });
    
    this.ctx.strokeStyle = '#2c2c2c';
    this.ctx.lineWidth = 8;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.strokePoints[0].x, this.strokePoints[0].y);
    
    for (let i = 1; i < this.strokePoints.length; i++) {
      this.ctx.lineTo(this.strokePoints[i].x, this.strokePoints[i].y);
    }
    this.ctx.stroke();
  }

  stopDrawing() {
    if (this.isDrawing && this.currentMonster && !this.currentMonster.isBoss) {
      this.game.audio.playSuccess();
      setTimeout(() => this.submit(), 200);
    }
    this.isDrawing = false;
  }

  handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.isDrawing = true;
    this.strokePoints = [];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    this.strokePoints.push({ x, y });
    
    if (this.lastPoint) {
      this.strokeCount++;
    }
    this.lastPoint = { x, y };
    this.hasWritten = true;
  }

  handleTouchMove(e) {
    e.preventDefault();
    if (!this.isDrawing) return;
    
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    this.strokePoints.push({ x, y });
    
    this.ctx.strokeStyle = '#2c2c2c';
    this.ctx.lineWidth = 8;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.strokePoints[0].x, this.strokePoints[0].y);
    
    for (let i = 1; i < this.strokePoints.length; i++) {
      this.ctx.lineTo(this.strokePoints[i].x, this.strokePoints[i].y);
    }
    this.ctx.stroke();
  }

  cancel() {
    this.game.onDrawComplete(false);
  }

  submit() {
    if (this.currentMonster && this.currentMonster.isBoss) {
      const targetStrokes = this.currentMonster.targetStrokeCount || 1;
      const drawnStrokes = Math.max(1, this.strokeCount);
      
      const isMatch = Math.abs(drawnStrokes - targetStrokes) <= 1;
      
      if (isMatch) {
        this.game.audio.playSuccess();
        this.game.onDrawComplete(true);
      } else {
        this.game.audio.playFail();
        this.game.showDamagePopup(`笔画数错误! 需要${targetStrokes}笔，你写了${drawnStrokes}笔`);
        setTimeout(() => this.game.onDrawComplete(false), 1000);
      }
    } else {
      this.game.onDrawComplete(true);
    }
  }
}
