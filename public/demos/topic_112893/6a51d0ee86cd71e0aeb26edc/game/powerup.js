// ===================================================================
// powerup.js - 奖励飞机与武器道具
// 奖励飞机：金色，正弦曲线飞行，击破后掉落武器字母道具
// 道具：S/M/L/F/R 五种武器字母，触碰后切换/升级武器（参考魂斗罗）
// ===================================================================

import { REWARD, POWERUP, DROP_WEAPONS, WEAPONS, WIDTH } from './config.js';

// 奖励飞机：金色，从屏幕侧方进入，正弦曲线穿场
export class RewardPlane {
    constructor() {
        this.width = REWARD.width;
        this.height = REWARD.height;
        this.fromLeft = Math.random() < 0.5;
        this.x = this.fromLeft ? -this.width : WIDTH + this.width;
        this.y = 80 + Math.random() * 200;
        this.startY = this.y;
        this.speed = REWARD.speed * (this.fromLeft ? 1 : -1);
        this.hp = REWARD.hp;
        this.color = REWARD.color;
        this.dead = false;
        this.tick = 0;
        this.flash = 0;
    }

    update() {
        this.tick++;
        this.x += this.speed;
        // 正弦曲线
        this.y = this.startY + Math.sin(this.tick * 0.06) * 50;
        if (this.flash > 0) this.flash--;
        // 碰到左右边界反弹，一直留在屏幕内直到被击破
        if (this.x < this.width) {
            this.x = this.width;
            this.speed = Math.abs(this.speed);
        } else if (this.x > WIDTH - this.width) {
            this.x = WIDTH - this.width;
            this.speed = -Math.abs(this.speed);
        }
        // 确保上下也在屏幕内
        if (this.y < this.height) {
            this.startY = this.height;
            this.y = this.height;
        } else if (this.y > 300) {
            this.startY = 300;
            this.y = 300;
        }
    }

    damage(amount = 1) {
        this.hp -= amount;
        this.flash = 4;
        if (this.hp <= 0) {
            this.dead = true;
            return true;
        }
        return false;
    }

    // 击破后生成道具
    dropPowerup() {
        const weapon = DROP_WEAPONS[Math.floor(Math.random() * DROP_WEAPONS.length)];
        return new PowerupItem(this.x, this.y, weapon);
    }

    getBounds() {
        return { x: this.x - this.width / 2, y: this.y - this.height / 2, w: this.width, h: this.height };
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        const flashing = this.flash > 0;

        // 头顶血条
        const barW = this.width;
        const barH = 3;
        const barY = -this.height / 2 - 8;
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(-barW / 2, barY, barW, barH);
        const ratio = Math.max(0, this.hp / REWARD.hp);
        ctx.fillStyle = '#fff200';
        ctx.shadowBlur = 3;
        ctx.shadowColor = '#fff200';
        ctx.fillRect(-barW / 2, barY, barW * ratio, barH);
        ctx.shadowBlur = 0;

        ctx.shadowBlur = 16;
        ctx.shadowColor = this.color;
        ctx.fillStyle = flashing ? '#ffffff' : this.color;

        // 圆形机身
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // 中心闪烁星标
        ctx.fillStyle = flashing ? this.color : '#ff6a00';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        const r = this.width / 4;
        for (let i = 0; i < 5; i++) {
            const a = (Math.PI * 2 * i) / 5 - Math.PI / 2 + this.tick * 0.05;
            const a2 = a + Math.PI / 5;
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            ctx.lineTo(Math.cos(a2) * r * 0.45, Math.sin(a2) * r * 0.45);
        }
        ctx.closePath();
        ctx.fill();

        // 旋转光环
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2 + 4, this.tick * 0.08, this.tick * 0.08 + Math.PI * 1.4);
        ctx.stroke();

        ctx.restore();
    }
}

// 武器字母道具：缓慢下落，玩家触碰生效
export class PowerupItem {
    constructor(x, y, weapon) {
        this.x = x;
        this.y = y;
        this.width = POWERUP.width;
        this.height = POWERUP.height;
        this.vy = POWERUP.speed;
        this.weapon = weapon;
        this.cfg = WEAPONS[weapon];
        this.dead = false;
        this.tick = 0;
    }

    update() {
        this.tick++;
        this.y += this.vy;
        // 轻微左右摆动
        this.x += Math.sin(this.tick * 0.08) * 0.6;
        if (this.y > 760) this.dead = true;
    }

    getBounds() {
        return { x: this.x - this.width / 2, y: this.y - this.height / 2, w: this.width, h: this.height };
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        const pulse = 1 + Math.sin(this.tick * 0.15) * 0.12;
        ctx.scale(pulse, pulse);

        ctx.shadowBlur = 14;
        ctx.shadowColor = this.cfg.glow;

        // 外框六边形
        ctx.strokeStyle = this.cfg.color;
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(10, 1, 24, 0.85)';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
            const px = Math.cos(a) * (this.width / 2);
            const py = Math.sin(a) * (this.width / 2);
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 武器字母
        ctx.fillStyle = this.cfg.color;
        ctx.shadowBlur = 8;
        ctx.font = 'bold 16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.weapon, 0, 1);

        ctx.restore();
    }
}

// 奖励飞机生成器：随机间隔
export class RewardSpawner {
    constructor() {
        this.timer = 0;
        this.nextSpawn = REWARD.spawnMinMs + Math.random() * (REWARD.spawnMaxMs - REWARD.spawnMinMs);
        this.active = true;
    }

    setActive(v) { this.active = v; }

    spawn(dt) {
        if (!this.active) return null;
        this.timer += dt;
        if (this.timer < this.nextSpawn) return null;
        this.timer = 0;
        this.nextSpawn = REWARD.spawnMinMs + Math.random() * (REWARD.spawnMaxMs - REWARD.spawnMinMs);
        return new RewardPlane();
    }

    reset() {
        this.timer = 0;
        this.nextSpawn = REWARD.spawnMinMs + Math.random() * (REWARD.spawnMaxMs - REWARD.spawnMinMs);
    }
}
