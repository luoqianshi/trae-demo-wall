export class Monster {
  constructor(game, x, y, radical, isBoss = false) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.radical = radical;
    this.isBoss = isBoss;
    this.size = isBoss ? 75 : 50;
    this.hp = isBoss ? 2 : 1;
    
    this.targetX = x;
    this.targetY = y;
    this.speed = isBoss ? 1.5 : 3;
    this.moveTimer = 0;
    this.moveInterval = 1;
    
    this.weaknessActive = false;
    this.weaknessTimer = 0;
    this.weaknessDuration = 5;
    this.weaknessCooldown = 2;
    this.weaknessCooldownDuration = 3;
    
    this.angle = 0;
    this.pulsePhase = 0;
    
    this.trail = [];
    this.maxTrailLength = 15;
  }

  update(deltaTime) {
    this.angle += deltaTime * 0.5;
    this.pulsePhase += deltaTime * 2;
    
    if (!this.isBoss) {
      this.moveTimer += deltaTime;
      if (this.moveTimer >= this.moveInterval) {
        this.moveTimer = 0;
        this.setNewTarget();
      }
      
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 5) {
        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;
        
        this.trail.push({ x: this.x, y: this.y, alpha: 1 });
        if (this.trail.length > this.maxTrailLength) {
          this.trail.shift();
        }
      }
    }
    
    this.trail.forEach(t => t.alpha -= 0.03);
    this.trail = this.trail.filter(t => t.alpha > 0);
    
    if (!this.weaknessActive && this.weaknessCooldown <= 0) {
      this.weaknessTimer += deltaTime;
      if (this.weaknessTimer >= 2) {
        this.weaknessTimer = 0;
        this.activateWeakness();
      }
    }
    
    if (this.weaknessActive) {
      this.weaknessTimer += deltaTime;
      if (this.weaknessTimer >= this.weaknessDuration) {
        this.deactivateWeakness();
        this.game.takeDamage();
      }
    }
    
    if (this.weaknessCooldown > 0) {
      this.weaknessCooldown -= deltaTime;
    }
  }

  setNewTarget() {
    const padding = 150;
    this.targetX = padding + Math.random() * (this.game.canvas.width - padding * 2);
    this.targetY = padding + 80 + Math.random() * (this.game.canvas.height - padding * 2 - 80);
  }

  activateWeakness() {
    this.weaknessActive = true;
    this.weaknessTimer = 0;
    this.game.showDrawModal(this.radical, this);
    this.game.audio.playWeakness();
  }

  deactivateWeakness() {
    this.weaknessActive = false;
    this.weaknessCooldown = this.weaknessCooldownDuration;
  }

  draw() {
    const ctx = this.game.ctx;
    
    if (this.trail.length > 1) {
      ctx.save();
      ctx.strokeStyle = this.isBoss ? 'rgba(212, 175, 55, 0.3)' : 'rgba(44, 44, 44, 0.2)';
      ctx.lineWidth = this.size * 0.6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++) {
        ctx.lineTo(this.trail[i].x, this.trail[i].y);
      }
      ctx.stroke();
      
      this.trail.forEach((t, i) => {
        const size = (this.size * 0.3) * (i / this.trail.length);
        ctx.fillStyle = this.isBoss 
          ? `rgba(212, 175, 55, ${t.alpha * 0.3})` 
          : `rgba(44, 44, 44, ${t.alpha * 0.25})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }
    
    ctx.save();
    ctx.translate(this.x, this.y);
    
    const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.08;
    ctx.scale(pulseScale, pulseScale);
    
    if (this.isBoss) {
      this.drawBoss(ctx);
    } else {
      this.drawMinion(ctx);
    }
    
    if (this.weaknessActive) {
      this.drawWeakness(ctx);
    }
    
    ctx.restore();
  }

  drawMinion(ctx) {
    ctx.strokeStyle = '#2c2c2c';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(44, 44, 44, 0.2)';
    ctx.beginPath();
    ctx.arc(0, 0, this.size - 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#2c2c2c';
    ctx.font = `bold ${this.size * 0.6}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.radical, 0, 2);
  }

  drawBoss(ctx) {
    const spikes = 8;
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    
    ctx.beginPath();
    for (let i = 0; i < spikes; i++) {
      const angle = (i / spikes) * Math.PI * 2;
      const outerRadius = this.size;
      const innerRadius = this.size * 0.7;
      
      const x1 = Math.cos(angle) * outerRadius;
      const y1 = Math.sin(angle) * outerRadius;
      const x2 = Math.cos(angle + Math.PI / spikes) * innerRadius;
      const y2 = Math.sin(angle + Math.PI / spikes) * innerRadius;
      
      if (i === 0) {
        ctx.moveTo(x1, y1);
      } else {
        ctx.lineTo(x1, y1);
      }
      ctx.lineTo(x2, y2);
    }
    ctx.closePath();
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.fill();
    
    ctx.fillStyle = '#d4af37';
    ctx.font = `bold ${this.size * 0.7}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.radical, 0, 2);
    
    if (this.hp > 1) {
      ctx.fillStyle = '#2c2c2c';
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.fillText(`HP: ${this.hp}`, 0, this.size + 20);
    }
  }

  drawWeakness(ctx) {
    const pulse = Math.sin(Date.now() / 80) * 0.3 + 1;
    
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, this.size + 18 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, this.size + 30 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 18px "Ma Shan Zheng", "KaiTi", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.shadowColor = '#d4af37';
    ctx.shadowBlur = 10;
    ctx.fillText('弱点!', 0, -this.size - 30);
    ctx.shadowBlur = 0;
  }

  isClicked(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.sqrt(dx * dx + dy * dy) < this.size + 10;
  }
}