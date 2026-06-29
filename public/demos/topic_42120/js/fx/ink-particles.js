export class InkParticles {
  constructor(game) {
    this.game = game;
    this.particles = [];
  }

  createExplosion(x, y, count = 15) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      
      this.game.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.02,
      });
    }
  }

  update(deltaTime) {
    this.game.particles = this.game.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.alpha -= p.decay;
      p.size *= 0.98;
      return p.alpha > 0;
    });
  }
}