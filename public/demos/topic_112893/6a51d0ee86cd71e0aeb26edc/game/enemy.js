// ===================================================================
// enemy.js - 敌机系统
// 三种敌机：basic 直线 / zigzag 之字形 / dive 俯冲
// 含敌机生成器，按难度配置生成间隔与血量
// ===================================================================

import { ENEMY_TYPES, DIFFICULTY, WIDTH } from './config.js';

export class Enemy {
    constructor(type, hpMul, speedMul) {
        const tpl = ENEMY_TYPES.find(t => t.type === type) ?? ENEMY_TYPES[0];
        this.type = tpl.type;
        this.width = tpl.w;
        this.height = tpl.h;
        this.x = 30 + Math.random() * (WIDTH - 60);
        this.y = -tpl.h;
        this.baseHp = Math.max(1, Math.round(tpl.hp * hpMul));
        this.hp = this.baseHp;
        this.speed = tpl.speed * speedMul;
        this.color = tpl.color;
        this.score = tpl.score;
        this.dead = false;
        // 行为参数
        this.tick = 0;
        this.startX = this.x;
        this.diveTargetX = 0;
        this.diveLocked = false;
        this.flash = 0; // 受击闪烁
    }

    update(playerX, playerY) {
        this.tick++;

        switch (this.type) {
            case 'basic':
                this.y += this.speed;
                break;
            case 'zigzag':
                this.y += this.speed * 0.85;
                this.x = this.startX + Math.sin(this.tick * 0.05) * 70;
                this.x = Math.max(this.width / 2, Math.min(WIDTH - this.width / 2, this.x));
                break;
            case 'dive':
                if (!this.diveLocked) {
                    // 飞行一段后锁定玩家 X 并俯冲
                    if (this.tick > 40) {
                        this.diveTargetX = playerX;
                        this.diveLocked = true;
                    }
                    this.y += this.speed * 0.6;
                } else {
                    const dx = this.diveTargetX - this.x;
                    this.x += Math.sign(dx) * Math.min(Math.abs(dx), this.speed * 0.8);
                    this.y += this.speed * 1.3;
                }
                break;
        }

        if (this.flash > 0) this.flash--;
        if (this.y > 760 + this.height) this.dead = true; // 离屏回收
    }

    damage(amount = 1) {
        this.hp -= amount;
        this.flash = 4;
        if (this.hp <= 0) this.dead = true;
        return this.dead;
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            w: this.width,
            h: this.height,
        };
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const flashing = this.flash > 0;

        // 头顶血条（仅最大血量 > 1 时显示）
        if (this.baseHp > 1) {
            const barW = this.width;
            const barH = 4;
            const barY = -this.height / 2 - 8;
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(-barW / 2, barY, barW, barH);
            const ratio = Math.max(0, this.hp / this.baseHp);
            const hpColor = ratio > 0.5 ? '#39ff14' : (ratio > 0.25 ? '#fff200' : '#ff2e88');
            ctx.fillStyle = hpColor;
            ctx.shadowBlur = 4;
            ctx.shadowColor = hpColor;
            ctx.fillRect(-barW / 2, barY, barW * ratio, barH);
            ctx.shadowBlur = 0;
        }

        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = flashing ? '#ffffff' : this.color;

        if (this.type === 'basic') {
            // 倒三角红色小机
            ctx.beginPath();
            ctx.moveTo(0, this.height / 2);
            ctx.lineTo(this.width / 2, -this.height / 2);
            ctx.lineTo(-this.width / 2, -this.height / 2);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = flashing ? this.color : '#330011';
            ctx.fillRect(-4, -6, 8, 8);
        } else if (this.type === 'zigzag') {
            // 菱形橙色机
            ctx.beginPath();
            ctx.moveTo(0, this.height / 2);
            ctx.lineTo(this.width / 2, 0);
            ctx.lineTo(0, -this.height / 2);
            ctx.lineTo(-this.width / 2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = flashing ? this.color : '#552200';
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // dive：箭头形紫色机
            ctx.beginPath();
            ctx.moveTo(0, this.height / 2);
            ctx.lineTo(this.width / 2, 0);
            ctx.lineTo(this.width / 3, -this.height / 2);
            ctx.lineTo(-this.width / 3, -this.height / 2);
            ctx.lineTo(-this.width / 2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = flashing ? this.color : '#220033';
            ctx.fillRect(-6, -4, 12, 6);
        }

        ctx.restore();
    }
}

// ===================================================================
// 敌机生成器：按难度间隔生成，关卡越高出现更强敌机
// ===================================================================
export class EnemySpawner {
    constructor(difficulty, level) {
        const d = DIFFICULTY[difficulty];
        this.interval = d.enemySpawnMs;
        this.hpMul = d.enemyHpMul * (1 + (level - 1) * 0.25); // 关卡递增血量
        this.speedMul = d.enemySpeedMul * (1 + (level - 1) * 0.08);
        this.timer = 0;
        this.level = level;
        this.active = true;
    }

    setActive(v) { this.active = v; }

    // 返回新生成的敌机数组（可能为空）
    spawn(dt) {
        if (!this.active) return [];
        this.timer += dt;
        if (this.timer < this.interval) return [];
        this.timer = 0;

        const enemies = [];
        // 关卡决定可出现的敌机种类
        const pool = ['basic'];
        if (this.level >= 1) pool.push('zigzag');
        if (this.level >= 2) pool.push('dive');

        // 有概率成组生成
        const groupRoll = Math.random();
        const type = pool[Math.floor(Math.random() * pool.length)];

        if (groupRoll < 0.7 || this.level === 1) {
            enemies.push(new Enemy(type, this.hpMul, this.speedMul));
        } else {
            // 编队：3 个同类横排
            const baseX = 60 + Math.random() * (WIDTH - 120);
            for (let i = -1; i <= 1; i++) {
                const e = new Enemy(type, this.hpMul, this.speedMul);
                e.x = Math.max(30, Math.min(WIDTH - 30, baseX + i * 50));
                e.startX = e.x;
                enemies.push(e);
            }
        }
        return enemies;
    }

    reset() {
        this.timer = 0;
    }
}
