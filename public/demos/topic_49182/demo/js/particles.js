const ParticleSystem = {
  canvas: null,
  ctx: null,
  particles: [],
  mouse: { x: null, y: null, radius: 150 },
  animationId: null,
  config: {
    particleCount: 120,
    particleRadius: 2,
    lineDistance: 120,
    mouseLineDistance: 200,
    speed: 0.5,
    colors: [
      'rgba(6, 182, 212, 1)',
      'rgba(34, 211, 238, 1)',
      'rgba(16, 185, 129, 1)',
      'rgba(14, 165, 233, 1)',
    ],
    lineColor: 'rgba(6, 182, 212, 0.3)',
    mouseLineColor: 'rgba(34, 211, 238, 0.6)',
  },

  init(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    Object.assign(this.config, options);

    this.resize();
    this.createParticles();
    this.bindEvents();
    this.animate();
  },

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  createParticles() {
    this.particles = [];
    const count = Math.min(this.config.particleCount, Math.floor(window.innerWidth / 10));

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * this.config.speed,
        vy: (Math.random() - 0.5) * this.config.speed,
        radius: Math.random() * this.config.particleRadius + 1,
        color: this.config.colors[Math.floor(Math.random() * this.config.colors.length)],
      });
    }
  },

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.createParticles();
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('mouseout', () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.mouse.x = e.touches[0].clientX;
        this.mouse.y = e.touches[0].clientY;
      }
    });

    window.addEventListener('touchend', () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });
  },

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < 0 || particle.x > this.canvas.width) {
        particle.vx = -particle.vx;
      }
      if (particle.y < 0 || particle.y > this.canvas.height) {
        particle.vy = -particle.vy;
      }

      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = particle.color;
      this.ctx.fill();
    });

    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.config.lineDistance) {
          const opacity = 1 - distance / this.config.lineDistance;
          this.ctx.beginPath();
          this.ctx.strokeStyle = `rgba(6, 182, 212, ${opacity * 0.3})`;
          this.ctx.lineWidth = 1;
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
        }
      }

      if (this.mouse.x !== null && this.mouse.y !== null) {
        const dx = this.particles[i].x - this.mouse.x;
        const dy = this.particles[i].y - this.mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.config.mouseLineDistance) {
          const opacity = 1 - distance / this.config.mouseLineDistance;
          this.ctx.beginPath();
          this.ctx.strokeStyle = `rgba(34, 211, 238, ${opacity * 0.6})`;
          this.ctx.lineWidth = 1.5;
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.mouse.x, this.mouse.y);
          this.ctx.stroke();

          const force = (this.config.mouseLineDistance - distance) / this.config.mouseLineDistance;
          this.particles[i].x += dx * force * 0.02;
          this.particles[i].y += dy * force * 0.02;
        }
      }
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  },

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ParticleSystem;
}
