// ====== Canvas 粒子特效系统 ======
// 全屏 Canvas + requestAnimationFrame 驱动，替代原 DOM div 方案
// 粒子立即发射，与格子翻转动画同帧启动，彻底消除时序滞后

// ------ 粒子类 ------
class Particle {
    constructor(x, y, opts = {}) {
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
        this.vx = opts.vx || 0;
        this.vy = opts.vy || 0;
        this.ax = opts.ax || 0;       // 水平加速度
        this.ay = opts.ay || 0;       // 垂直加速度（重力等）
        this.life = opts.life || 600; // 生命周期 ms
        this.maxLife = this.life;
        this.size = opts.size || 6;
        this.startSize = this.size;
        this.endSize = opts.endSize != null ? opts.endSize : this.size;
        this.color = opts.color || '#10b981';
        this.endColor = opts.endColor || this.color;
        this.type = opts.type || 'glow';   // glow | spark | ring | shard | plus | ringRect
        this.alpha = opts.alpha != null ? opts.alpha : 1;
        this.rotation = opts.rotation || 0;
        this.rotSpeed = opts.rotSpeed || 0;
        this.ringExpand = opts.ringExpand || 0; // ring 类型每帧半径增量
        this.ringWidth = opts.ringWidth || 2;
        this.rectW = opts.rectW || 80;  // ringRect 宽
        this.rectH = opts.rectH || 80;  // ringRect 高
        this.grow = opts.grow || 0;     // glow 半径随生命增长系数
    }

    update(dt) {
        this.prevX = this.x;
        this.prevY = this.y;
        this.vx += this.ax * dt;
        this.vy += this.ay * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.rotation += this.rotSpeed * dt;
        this.life -= dt * 1000;
        // 尺寸插值
        const t = 1 - this.life / this.maxLife;
        this.size = this.startSize + (this.endSize - this.startSize) * t;
        // alpha 随生命衰减（后半段渐隐）
        this.alpha = this.life > this.maxLife * 0.5 ? 1 : Math.max(0, this.life / (this.maxLife * 0.5));
    }

    draw(ctx) {
        if (this.alpha <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.alpha;

        if (this.type === 'glow') {
            const r = Math.max(0.5, this.size);
            const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
            grad.addColorStop(0, this.color);
            grad.addColorStop(0.5, this.color);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'spark') {
            // 拖尾线条
            ctx.strokeStyle = this.color;
            ctx.lineWidth = Math.max(0.5, this.size * 0.5);
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(this.prevX, this.prevY);
            ctx.lineTo(this.x, this.y);
            ctx.stroke();
            // 头部光点
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, Math.max(0.5, this.size * 0.4), 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'ring') {
            const r = Math.max(0.5, this.size);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.ringWidth;
            ctx.beginPath();
            ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
            ctx.stroke();
        } else if (this.type === 'ringRect') {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.ringWidth;
            ctx.strokeRect(this.x - this.rectW / 2, this.y - this.rectH / 2, this.rectW, this.rectH);
        } else if (this.type === 'shard') {
            const s = Math.max(0.5, this.size);
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(-s, -s);
            ctx.lineTo(s, -s * 0.5);
            ctx.lineTo(s, s);
            ctx.lineTo(-s * 0.5, s);
            ctx.closePath();
            ctx.fill();
        } else if (this.type === 'plus') {
            const s = Math.max(0.5, this.size);
            ctx.translate(this.x, this.y);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = Math.max(1, s * 0.35);
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-s, 0);
            ctx.lineTo(s, 0);
            ctx.moveTo(0, -s);
            ctx.lineTo(0, s);
            ctx.stroke();
        }

        ctx.restore();
    }

    get dead() { return this.life <= 0; }
}

// ------ 特效系统 ------
class EffectSystem {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.running = false;
        this.lastTime = 0;
        this.maxParticles = 500;
        this.initCanvas();
    }

    /** 初始化全屏 Canvas */
    initCanvas() {
        if (this.canvas) return;
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'effectCanvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
        `;
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    /** 调整 Canvas 尺寸（含高清屏 devicePixelRatio） */
    resize() {
        if (!this.canvas) return;
        const dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /** 添加粒子（含上限保护） */
    add(p) {
        if (this.particles.length >= this.maxParticles) {
            this.particles.shift(); // 丢弃最老粒子
        }
        this.particles.push(p);
        this.ensureRunning();
    }

    /** 确保 rAF 循环运行 */
    ensureRunning() {
        if (!this.running) {
            this.running = true;
            this.lastTime = performance.now();
            requestAnimationFrame((t) => this.loop(t));
        }
    }

    /** 主循环 */
    loop(timestamp) {
        const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000); // 秒，限制最大 50ms
        this.lastTime = timestamp;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // additive blending 让重叠粒子发光叠加
        this.ctx.globalCompositeOperation = 'lighter';

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update(dt);
            p.draw(this.ctx);
            if (p.dead) this.particles.splice(i, 1);
        }

        this.ctx.globalCompositeOperation = 'source-over';

        if (this.particles.length === 0) {
            this.running = false;
        } else {
            requestAnimationFrame((t) => this.loop(t));
        }
    }

    // ====== 粒子发射辅助 ======

    /** 发射径向爆散粒子 */
    burst(x, y, count, opts) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
            const speed = opts.speed * (0.7 + Math.random() * 0.6);
            this.add(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                ay: opts.gravity || 0,
                life: opts.life,
                size: opts.size * (0.7 + Math.random() * 0.6),
                endSize: opts.endSize != null ? opts.endSize : opts.size * 0.3,
                color: opts.color,
                type: opts.type || 'glow',
                rotation: Math.random() * Math.PI,
                rotSpeed: opts.rotSpeed || 0,
            }));
        }
    }

    // ====== 各特效发射器（保留原 API 签名） ======

    /** 木·延伸 - 藤蔓光束 + 终点绿叶爆散 */
    woodExtend(startX, startY, targetX, targetY) {
        const dx = targetX - startX;
        const dy = targetY - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.max(6, Math.floor(dist / 12));
        // 藤蔓光束（spark 链）
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const px = startX + dx * t;
            const py = startY + dy * t;
            this.add(new Particle(px, py, {
                vx: dx * 0.3, vy: dy * 0.3,
                life: 400 + t * 200,
                size: 5 + Math.random() * 2,
                endSize: 1,
                color: '#10b981',
                type: 'glow',
            }));
        }
        // 起点棕色光晕
        this.add(new Particle(startX, startY, {
            life: 500, size: 18, endSize: 4, color: '#92400e', type: 'glow',
        }));
        // 终点绿叶爆散
        this.burst(targetX, targetY, 10, {
            speed: 80, life: 600, size: 6, color: '#22c55e', type: 'shard',
            rotSpeed: (Math.random() - 0.5) * 10,
        });
        // 终点绿色光环
        this.add(new Particle(targetX, targetY, {
            life: 700, size: 8, endSize: 40, color: '#10b981', type: 'ring', ringWidth: 3,
        }));
    }

    /** 土·落石 - 石头下落 + 尘云 + 屏幕震动 */
    earthRockFall(targetX, targetY) {
        // 6 块石头从上方落下
        for (let i = 0; i < 6; i++) {
            const offsetX = (Math.random() - 0.5) * 40;
            const startY = targetY - 120 - Math.random() * 40;
            this.add(new Particle(targetX + offsetX, startY, {
                vx: (Math.random() - 0.5) * 20,
                vy: 0,
                ay: 600, // 重力加速度
                life: 500 + i * 60,
                size: 8 + Math.random() * 4,
                endSize: 6,
                color: '#78716c',
                type: 'shard',
                rotation: Math.random() * Math.PI,
                rotSpeed: (Math.random() - 0.5) * 8,
            }));
        }
        // 落地尘云（延迟通过更短 life 模拟，落地时位置在 targetY）
        setTimeout(() => {
            this.burst(targetX, targetY, 8, {
                speed: 50, life: 500, size: 10, endSize: 2, color: '#a8a29e', type: 'glow',
            });
            this.add(new Particle(targetX, targetY, {
                life: 500, size: 10, endSize: 35, color: '#78716c', type: 'ring', ringWidth: 2,
            }));
        }, 450);
        // 屏幕震动
        setTimeout(() => this.shakeScreen(), 480);
    }

    /** 金·切割 - 十字光剑 + 爆闪 + 火花 */
    metalSlash(targetX, targetY) {
        // 4 道金色光剑十字劈斩
        for (let i = 0; i < 4; i++) {
            const angle = (i * 90) * Math.PI / 180;
            const len = 50;
            const ex = targetX + Math.cos(angle) * len;
            const ey = targetY + Math.sin(angle) * len;
            // 沿光剑方向发射 spark
            const steps = 8;
            for (let j = 0; j <= steps; j++) {
                const t = j / steps;
                this.add(new Particle(targetX + (ex - targetX) * t, targetY + (ey - targetY) * t, {
                    vx: Math.cos(angle) * 200,
                    vy: Math.sin(angle) * 200,
                    life: 300 + t * 150,
                    size: 4,
                    endSize: 0.5,
                    color: '#fbbf24',
                    type: 'spark',
                }));
            }
        }
        // 中心白色爆闪
        this.add(new Particle(targetX, targetY, {
            life: 300, size: 30, endSize: 5, color: '#fef3c7', type: 'glow',
        }));
        this.add(new Particle(targetX, targetY, {
            life: 400, size: 10, endSize: 50, color: '#fbbf24', type: 'ring', ringWidth: 3,
        }));
        // 金色火花四溅
        this.burst(targetX, targetY, 10, {
            speed: 120, life: 500, size: 4, endSize: 1, color: '#f59e0b', type: 'spark',
        });
    }

    /** 水·波动 - 同心圆环 + 水滴飞溅 */
    waterWave(targetX, targetY) {
        // 3 层蓝色同心圆环扩散
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.add(new Particle(targetX, targetY, {
                    life: 700, size: 8, endSize: 70, color: '#3b82f6', type: 'ring', ringWidth: 3,
                }));
            }, i * 150);
        }
        // 中心蓝色光晕
        this.add(new Particle(targetX, targetY, {
            life: 500, size: 25, endSize: 3, color: '#60a5fa', type: 'glow',
        }));
        // 12 颗水滴径向飞溅
        this.burst(targetX, targetY, 12, {
            speed: 70, life: 600, size: 5, endSize: 1, color: '#60a5fa', type: 'glow',
        });
    }

    /** 火·燃烧 - 火焰上升 + 火星 */
    fireBurn(targetX, targetY) {
        // 12 团火焰上升
        for (let i = 0; i < 12; i++) {
            const offsetX = (Math.random() - 0.5) * 30;
            this.add(new Particle(targetX + offsetX, targetY, {
                vx: (Math.random() - 0.5) * 20,
                vy: -60 - Math.random() * 40,
                ay: -20, // 持续上升加速
                life: 600 + Math.random() * 200,
                size: 8 + Math.random() * 5,
                endSize: 2,
                color: i % 2 ? '#f59e0b' : '#dc2626',
                type: 'glow',
            }));
        }
        // 8 颗火星抛物线飞溅
        this.burst(targetX, targetY, 8, {
            speed: 90, gravity: 200, life: 700, size: 3, endSize: 1, color: '#fbbf24', type: 'spark',
        });
    }

    /** 治疗特效 - 绿色十字上升 + 光环 + 星尘 */
    healEffect(targetX, targetY) {
        // 5 个绿色十字上升
        for (let i = 0; i < 5; i++) {
            const offsetX = (Math.random() - 0.5) * 40;
            this.add(new Particle(targetX + offsetX, targetY, {
                vx: 0,
                vy: -40 - Math.random() * 20,
                life: 800,
                size: 8,
                endSize: 4,
                color: '#10b981',
                type: 'plus',
            }));
        }
        // 绿色光环扩散
        this.add(new Particle(targetX, targetY, {
            life: 700, size: 10, endSize: 50, color: '#10b981', type: 'ring', ringWidth: 3,
        }));
        // 6 颗金色治愈星尘
        this.burst(targetX, targetY, 6, {
            speed: 40, life: 700, size: 4, endSize: 1, color: '#fde68a', type: 'glow',
        });
    }

    /** 护盾特效 - 六边形护盾展开 + 环绕粒子 */
    shieldEffect(targetX, targetY) {
        // 蓝色护盾光环多层展开
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.add(new Particle(targetX, targetY, {
                    life: 600, size: 15, endSize: 45, color: '#3b82f6', type: 'ring', ringWidth: 3,
                }));
            }, i * 100);
        }
        // 8 颗蓝色能量粒子环绕
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            this.add(new Particle(targetX, targetY, {
                vx: Math.cos(angle) * 60,
                vy: Math.sin(angle) * 60,
                life: 800,
                size: 5,
                endSize: 1,
                color: '#60a5fa',
                type: 'glow',
            }));
        }
    }

    /** 透视特效 - 紫色扫描方框 + 扫描线 + 光点 */
    peekEffect(targetX, targetY) {
        // 紫色扫描方框
        this.add(new Particle(targetX, targetY, {
            life: 600, size: 0, color: '#a855f7', type: 'ringRect', ringWidth: 2, rectW: 80, rectH: 80,
        }));
        // 紫色扫描线（从上到下扫过）
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                this.add(new Particle(targetX, targetY - 40 + i * 8, {
                    vx: 0, vy: 0,
                    life: 200,
                    size: 3,
                    endSize: 1,
                    color: '#c084fc',
                    type: 'spark',
                }));
            }, i * 50);
        }
        // 4 颗紫色光点
        this.burst(targetX, targetY, 4, {
            speed: 30, life: 500, size: 5, endSize: 1, color: '#a855f7', type: 'glow',
        });
    }

    /** 消除特效 - 红色碎片爆散 + 爆闪 + 内吸暗光环 */
    eliminateEffect(targetX, targetY) {
        // 10 块红色碎片放射爆散
        this.burst(targetX, targetY, 10, {
            speed: 100, life: 500, size: 7, endSize: 2, color: '#ef4444', type: 'shard',
            rotSpeed: (Math.random() - 0.5) * 10,
        });
        // 中心红色爆闪
        this.add(new Particle(targetX, targetY, {
            life: 300, size: 25, endSize: 3, color: '#fca5a5', type: 'glow',
        }));
        this.add(new Particle(targetX, targetY, {
            life: 400, size: 8, endSize: 45, color: '#ef4444', type: 'ring', ringWidth: 3,
        }));
    }

    /** 屏幕震动 */
    shakeScreen() {
        const page = document.querySelector('.dungeon-page');
        if (!page) return;
        page.classList.add('shake-anim');
        setTimeout(() => page.classList.remove('shake-anim'), 400);
    }

    /** 兼容旧 createParticle 接口：发射单个 glow 粒子 */
    createParticle(x, y, options = {}) {
        const p = new Particle(x, y, {
            vx: 0, vy: 0,
            life: options.duration || 600,
            size: options.size || 8,
            color: options.color || '#10b981',
            type: 'glow',
        });
        this.add(p);
        return p;
    }

    /** 根据技能效果类型播放对应特效（分发器，保留原签名） */
    playEffect(effectType, targetX, targetY) {
        switch (effectType) {
            case 'wood':
            case 'extend':
                this.woodExtend(targetX, targetY, targetX + 50, targetY + 50);
                break;
            case 'earth':
            case 'rock':
                this.earthRockFall(targetX, targetY);
                break;
            case 'metal':
            case 'slash':
                this.metalSlash(targetX, targetY);
                break;
            case 'water':
            case 'wave':
                this.waterWave(targetX, targetY);
                break;
            case 'fire':
            case 'burn':
                this.fireBurn(targetX, targetY);
                break;
            case 'heal':
            case 'fullHeal':
                this.healEffect(targetX, targetY);
                break;
            case 'shield':
                this.shieldEffect(targetX, targetY);
                break;
            case 'peekArea':
                this.peekEffect(targetX, targetY);
                break;
            case 'eliminateRadical':
                this.eliminateEffect(targetX, targetY);
                break;
            default:
                // 默认：金色闪光
                this.add(new Particle(targetX, targetY, {
                    life: 400, size: 20, endSize: 3, color: '#fbbf24', type: 'glow',
                }));
        }
    }
}

// 导出单例
export const effectSystem = new EffectSystem();
