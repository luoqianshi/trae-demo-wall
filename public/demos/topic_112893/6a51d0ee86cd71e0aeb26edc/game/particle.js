// ===================================================================
// particle.js - 粒子特效系统
// 用于爆炸、击中、引擎尾焰等视觉效果
// ===================================================================

export class Particle {
    constructor(x, y, vx, vy, life, color, size, gravity = 0) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;       // 剩余生命帧
        this.maxLife = life;
        this.color = color;
        this.size = size;
        this.gravity = gravity; // 可选重力影响
        this.dead = false;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= 0.96; // 阻尼
        this.vy *= 0.96;
        this.life--;
        if (this.life <= 0) this.dead = true;
    }

    render(ctx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        const r = Math.max(0.5, this.size * alpha);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// 粒子系统：统一管理所有粒子，限制最大数量保证性能
export class ParticleSystem {
    constructor(maxParticles = 280) {
        this.particles = [];
        this.max = maxParticles;
    }

    // 添加单个粒子
    add(p) {
        if (this.particles.length < this.max) {
            this.particles.push(p);
        }
    }

    // 爆炸效果：多色粒子向外扩散
    explode(x, y, color, count = 18, power = 4) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
            const speed = power * (0.4 + Math.random() * 0.9);
            const c = i % 3 === 0 ? '#ffffff' : (i % 3 === 1 ? color : '#fff200');
            this.add(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                22 + Math.random() * 18,
                c,
                2 + Math.random() * 2,
            ));
        }
        // 中心闪光
        this.add(new Particle(x, y, 0, 0, 12, '#ffffff', 10));
    }

    // 小型击中火花
    hit(x, y, color, count = 6) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            this.add(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                10 + Math.random() * 8,
                color,
                1.5 + Math.random() * 1.5,
            ));
        }
    }

    // 引擎尾焰（持续型，由调用方每帧添加）
    trail(x, y, color, vx = 0, vy = 2) {
        this.add(new Particle(
            x + (Math.random() - 0.5) * 4,
            y,
            vx + (Math.random() - 0.5) * 0.5,
            vy,
            14 + Math.random() * 6,
            color,
            2 + Math.random() * 1.5,
        ));
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].dead) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(ctx) {
        for (const p of this.particles) p.render(ctx);
    }

    clear() {
        this.particles.length = 0;
    }
}
