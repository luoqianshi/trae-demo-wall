interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];

  emit(x: number, y: number, count: number, color: string, speed: number = 3) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * speed * 2,
        vy: -Math.random() * speed - 1,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  emitBrickBreak(x: number, y: number) {
    const colors = ['#C84C0C', '#A0380C', '#E08030'];
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x + Math.random() * 32,
        y: y + Math.random() * 32,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 8 - 2,
        life: 40 + Math.random() * 20,
        maxLife: 60,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 4,
      });
    }
  }

  emitCoinCollect(x: number, y: number) {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 4 - 1,
        life: 20 + Math.random() * 10,
        maxLife: 30,
        color: '#FCA044',
        size: 2 + Math.random() * 2,
      });
    }
  }

  emitStomp(x: number, y: number) {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 2,
        life: 15 + Math.random() * 10,
        maxLife: 25,
        color: '#FFFFFF',
        size: 3 + Math.random() * 2,
      });
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3; // 粒子重力
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number) {
    this.particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - cameraX, p.y - cameraY, p.size, p.size);
    });
    ctx.globalAlpha = 1;
  }
}
