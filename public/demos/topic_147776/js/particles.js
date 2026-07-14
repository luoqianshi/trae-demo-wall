/**
 * 星空粒子背景动画
 */
class ParticleBackground {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.stars = [];
    this.connectionDistance = 150;
    this.particleCount = 80;
    this.starCount = 200;
    this.animationId = null;
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // 创建粒子
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        color: this.getRandomColor()
      });
    }

    // 创建星星
    for (let i = 0; i < this.starCount; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        radius: Math.random() * 1.5,
        opacity: Math.random(),
        twinkleSpeed: Math.random() * 0.02 + 0.01
      });
    }

    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  getRandomColor() {
    const colors = [
      'rgba(0, 212, 255, ',   // 科技蓝
      'rgba(0, 245, 212, ',   // 能量青
      'rgba(123, 45, 255, ',  // 警示紫
      'rgba(255, 107, 53, '   // 数据橙
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  drawParticles() {
    this.particles.forEach((p, index) => {
      // 更新位置
      p.x += p.vx;
      p.y += p.vy;

      // 边界检测
      if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

      // 绘制粒子
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color + '0.8)';
      this.ctx.fill();

      // 绘制光晕
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
      const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
      gradient.addColorStop(0, p.color + '0.3)');
      gradient.addColorStop(1, p.color + '0)');
      this.ctx.fillStyle = gradient;
      this.ctx.fill();

      // 绘制连接线
      for (let i = index + 1; i < this.particles.length; i++) {
        const p2 = this.particles[i];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.connectionDistance) {
          const opacity = (1 - distance / this.connectionDistance) * 0.3;
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = p.color + opacity + ')';
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    });
  }

  drawStars() {
    this.stars.forEach(star => {
      // 闪烁效果
      star.opacity += star.twinkleSpeed;
      if (star.opacity > 1 || star.opacity < 0) {
        star.twinkleSpeed *= -1;
      }

      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      this.ctx.fill();
    });
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawStars();
    this.drawParticles();

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

// 导出
window.ParticleBackground = ParticleBackground;
