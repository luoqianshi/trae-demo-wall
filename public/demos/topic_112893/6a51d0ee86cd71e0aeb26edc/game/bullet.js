// ===================================================================
// bullet.js - 子弹系统
// 6 种武器形态：N 普通 / S 散射 / M 机枪 / L 激光 / F 火焰 / R 螺旋
// 参考魂斗罗武器升级机制
// ===================================================================

import { WEAPONS } from './config.js';

// 子弹基类：玩家子弹与敌方子弹共用
export class Bullet {
    constructor(opts) {
        this.x = opts.x;
        this.y = opts.y;
        this.vx = opts.vx ?? 0;
        this.vy = opts.vy ?? 0;
        this.width = opts.width ?? 6;
        this.height = opts.height ?? 14;
        this.damage = opts.damage ?? 1;
        this.color = opts.color ?? '#fff200';
        this.glow = opts.glow ?? this.color;
        this.owner = opts.owner ?? 'player'; // 'player' | 'enemy'
        this.pierce = opts.pierce ?? 0;      // 穿透次数（激光）
        this.hitSet = new Set();              // 已命中对象，避免穿透重复
        this.dead = false;
        this.shape = opts.shape ?? 'rect';   // rect / orb / beam
        // 螺旋弹用
        this.spiral = opts.spiral ?? null;   // {cx, radius, speed, phase}
        this.life = opts.life ?? 999;
        this.spin = opts.spin ?? 0;
    }

    update() {
        if (this.spiral) {
            this.spiral.phase += this.spiral.speed;
            this.x = this.spiral.cx + Math.cos(this.spiral.phase) * this.spiral.radius;
            this.y += this.vy;
            this.spiral.cx += this.spiral.driftX ?? 0;
        } else {
            this.x += this.vx;
            this.y += this.vy;
        }
        this.life--;
        if (this.life <= 0) this.dead = true;
    }

    // 离屏回收
    isOffscreen(W, H) {
        return this.y < -30 || this.y > H + 30 || this.x < -30 || this.x > W + 30;
    }

    // 渲染：根据 shape 绘制不同样式
    render(ctx) {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.glow;
        ctx.fillStyle = this.color;

        if (this.shape === 'beam') {
            // 激光长条
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x - this.width / 4, this.y - this.height / 2, this.width / 2, this.height);
        } else if (this.shape === 'orb') {
            // 火焰球
            const r = this.width / 2;
            const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.4, this.color);
            grad.addColorStop(1, 'rgba(255,106,0,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.shape === 'spiral') {
            // 螺旋弹：旋转的菱形
            ctx.translate(this.x, this.y);
            ctx.rotate(this.spiral ? this.spiral.phase : 0);
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(0, -this.width / 2);
            ctx.lineTo(this.width / 2, 0);
            ctx.lineTo(0, this.width / 2);
            ctx.lineTo(-this.width / 2, 0);
            ctx.closePath();
            ctx.fill();
        } else {
            // 默认矩形弹
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x - this.width / 4, this.y - this.height / 2, this.width / 2, this.height);
        }
        ctx.restore();
    }
}

// ===================================================================
// 玩家子弹工厂：根据武器与等级生成一组子弹
// 等级越高，弹数/伤害越强
// ===================================================================
const BULLET_SPEED_MUL = 1.25;

export function spawnPlayerBullets(weapon, level, x, y) {
    const cfg = WEAPONS[weapon];
    const lv = Math.max(1, Math.min(3, level));
    const bullets = [];

    switch (weapon) {
        case 'N': // 普通弹：单发直线，等级提升增加伤害与并发
            if (lv === 1) {
                bullets.push(makeRect(x, y, 0, -9, 6, 14, 1, cfg));
            } else if (lv === 2) {
                bullets.push(makeRect(x - 8, y, 0, -9, 5, 14, 1, cfg));
                bullets.push(makeRect(x + 8, y, 0, -9, 5, 14, 1, cfg));
            } else {
                bullets.push(makeRect(x - 10, y, 0, -9.5, 5, 16, 1, cfg));
                bullets.push(makeRect(x, y - 4, 0, -10, 6, 18, 2, cfg));
                bullets.push(makeRect(x + 10, y, 0, -9.5, 5, 16, 1, cfg));
            }
            break;

        case 'S': // 散射弹：扇形多发
            if (lv === 1) {
                bullets.push(makeRect(x, y, 0, -8, 6, 12, 1, cfg));
                bullets.push(makeRect(x, y, -2.2, -7.5, 6, 12, 1, cfg));
                bullets.push(makeRect(x, y, 2.2, -7.5, 6, 12, 1, cfg));
            } else if (lv === 2) {
                bullets.push(makeRect(x, y, 0, -8.5, 6, 13, 1, cfg));
                bullets.push(makeRect(x, y, -1.8, -8, 6, 13, 1, cfg));
                bullets.push(makeRect(x, y, 1.8, -8, 6, 13, 1, cfg));
                bullets.push(makeRect(x, y, -3.6, -7, 6, 12, 1, cfg));
                bullets.push(makeRect(x, y, 3.6, -7, 6, 12, 1, cfg));
            } else {
                bullets.push(makeRect(x, y, 0, -9, 7, 14, 2, cfg));
                bullets.push(makeRect(x, y, -1.8, -8.5, 6, 13, 1, cfg));
                bullets.push(makeRect(x, y, 1.8, -8.5, 6, 13, 1, cfg));
                bullets.push(makeRect(x, y, -3.8, -7.5, 6, 12, 1, cfg));
                bullets.push(makeRect(x, y, 3.8, -7.5, 6, 12, 1, cfg));
                bullets.push(makeRect(x, y, -5.5, -6, 6, 11, 1, cfg));
                bullets.push(makeRect(x, y, 5.5, -6, 6, 11, 1, cfg));
            }
            break;

        case 'M': // 机枪弹：高频单发，等级提升双发/三发
            if (lv === 1) {
                bullets.push(makeRect(x, y, 0, -11, 4, 12, 1, cfg));
            } else if (lv === 2) {
                bullets.push(makeRect(x - 6, y, 0, -11, 4, 12, 1, cfg));
                bullets.push(makeRect(x + 6, y, 0, -11, 4, 12, 1, cfg));
            } else {
                bullets.push(makeRect(x - 10, y, 0, -11, 4, 12, 1, cfg));
                bullets.push(makeRect(x, y - 2, 0, -12, 4, 14, 1, cfg));
                bullets.push(makeRect(x + 10, y, 0, -11, 4, 12, 1, cfg));
            }
            break;

        case 'L': // 激光弹：穿透长条
            if (lv === 1) {
                bullets.push(makeBeam(x, y, -10, 4, 22, 1, cfg, 2));
            } else if (lv === 2) {
                bullets.push(makeBeam(x - 8, y, -10, 4, 22, 1, cfg, 3));
                bullets.push(makeBeam(x + 8, y, -10, 4, 22, 1, cfg, 3));
            } else {
                bullets.push(makeBeam(x - 12, y, -11, 5, 26, 2, cfg, 4));
                bullets.push(makeBeam(x, y - 4, -11, 5, 28, 2, cfg, 4));
                bullets.push(makeBeam(x + 12, y, -11, 5, 26, 2, cfg, 4));
            }
            break;

        case 'F': // 火焰弹：大型火球高伤害
            if (lv === 1) {
                bullets.push(makeOrb(x, y, 0, -7, 16, 2, cfg));
            } else if (lv === 2) {
                bullets.push(makeOrb(x - 8, y, -0.5, -7, 14, 2, cfg));
                bullets.push(makeOrb(x + 8, y, 0.5, -7, 14, 2, cfg));
            } else {
                bullets.push(makeOrb(x - 12, y, -1, -7, 14, 2, cfg));
                bullets.push(makeOrb(x, y - 4, 0, -8, 18, 3, cfg));
                bullets.push(makeOrb(x + 12, y, 1, -7, 14, 2, cfg));
            }
            break;

        case 'R': // 螺旋弹：双螺旋弹道
            if (lv === 1) {
                bullets.push(makeSpiral(x, y, -7, 22, 0.15, 0, cfg, 1));
                bullets.push(makeSpiral(x, y, -7, 22, 0.15, Math.PI, cfg, 1));
            } else if (lv === 2) {
                bullets.push(makeSpiral(x, y, -7.5, 26, 0.18, 0, cfg, 1));
                bullets.push(makeSpiral(x, y, -7.5, 26, 0.18, Math.PI, cfg, 1));
                bullets.push(makeSpiral(x, y, -7.5, 26, 0.18, Math.PI / 2, cfg, 1));
                bullets.push(makeSpiral(x, y, -7.5, 26, 0.18, -Math.PI / 2, cfg, 1));
            } else {
                bullets.push(makeSpiral(x, y, -8, 30, 0.2, 0, cfg, 2));
                bullets.push(makeSpiral(x, y, -8, 30, 0.2, Math.PI * 2 / 3, cfg, 2));
                bullets.push(makeSpiral(x, y, -8, 30, 0.2, Math.PI * 4 / 3, cfg, 2));
                bullets.push(makeSpiral(x, y, -8, 24, 0.22, Math.PI / 3, cfg, 1));
                bullets.push(makeSpiral(x, y, -8, 24, 0.22, Math.PI, cfg, 1));
                bullets.push(makeSpiral(x, y, -8, 24, 0.22, Math.PI * 5 / 3, cfg, 1));
            }
            break;
    }
    // 统一子弹速度缩放
    for (const b of bullets) {
        b.vx *= BULLET_SPEED_MUL;
        b.vy *= BULLET_SPEED_MUL;
    }
    return bullets;
}

// --- 子弹构造辅助 ---
function makeRect(x, y, vx, vy, w, h, dmg, cfg) {
    return new Bullet({ x, y, vx, vy, width: w, height: h, damage: dmg, color: cfg.color, glow: cfg.glow, owner: 'player', shape: 'rect' });
}
function makeBeam(x, y, vy, w, h, dmg, cfg, pierce) {
    return new Bullet({ x, y, vy, width: w, height: h, damage: dmg, color: cfg.color, glow: cfg.glow, owner: 'player', shape: 'beam', pierce });
}
function makeOrb(x, y, vx, vy, size, dmg, cfg) {
    return new Bullet({ x, y, vx, vy, width: size, height: size, damage: dmg, color: cfg.color, glow: cfg.glow, owner: 'player', shape: 'orb' });
}
function makeSpiral(x, y, vy, radius, speed, phase, cfg, dmg) {
    return new Bullet({
        x, y, vy, width: 10, height: 10, damage: dmg,
        color: cfg.color, glow: cfg.glow, owner: 'player',
        shape: 'spiral',
        spiral: { cx: x, radius, speed, phase, driftX: 0 },
    });
}

// ===================================================================
// 敌方子弹工厂
// ===================================================================
export function makeEnemyBullet(x, y, vx, vy, color = '#ff2e88', size = 8) {
    return new Bullet({
        x, y, vx, vy,
        width: size, height: size,
        damage: 1, color, glow: color,
        owner: 'enemy', shape: 'orb',
    });
}

// 朝目标方向发射敌方子弹
export function aimBullet(x, y, tx, ty, speed, color, size = 8) {
    const dx = tx - x;
    const dy = ty - y;
    const dist = Math.max(0.001, Math.hypot(dx, dy));
    return makeEnemyBullet(x, y, (dx / dist) * speed, (dy / dist) * speed, color, size);
}
