export class Brush {
  constructor(game) {
    this.game = game;
    this.x = 0;
    this.y = 0;
    this.trail = [];
    this.isDrawing = false;
    this.maxTrailLength = 20;
    this.brushSize = 8;
  }

  update(x, y, isDrawing) {
    this.x = x;
    this.y = y;
    
    if (isDrawing && this.game.state === 'PLAYING') {
      this.trail.push({ x, y, timestamp: Date.now() });
      if (this.trail.length > this.maxTrailLength) {
        this.trail.shift();
      }
    }
  }

  draw() {
    const ctx = this.game.ctx;
    
    this.trail.forEach((point, index) => {
      const alpha = index / this.trail.length;
      const size = this.brushSize * alpha;
      
      ctx.fillStyle = `rgba(44, 44, 44, ${alpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.save();
    ctx.translate(this.x, this.y);
    
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-3, -20, 6, 20);
    
    ctx.strokeStyle = '#2c2c2c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(0, -25);
    ctx.stroke();
    
    ctx.fillStyle = '#2c2c2c';
    ctx.beginPath();
    ctx.ellipse(0, 5, this.brushSize, this.brushSize * 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }

  clearTrail() {
    this.trail = [];
  }
}