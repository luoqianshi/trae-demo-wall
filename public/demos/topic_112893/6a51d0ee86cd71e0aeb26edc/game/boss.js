// ===================================================================
// boss.js - Boss 系统
// 三关 Boss，各自拥有不同技能：
//   关卡1 钢铁哨兵：scatter 扇形弹幕 + dash 定向冲刺
//   关卡2 激光母舰：laser 横向激光 + missile 跟踪导弹
//   关卡3 深渊主宰：summon 召唤小怪 + homing 追踪弹 + bulletstorm 全屏弹幕
// ===================================================================

import { BOSSES, WIDTH, HEIGHT, DIFFICULTY } from './config.js';
import { aimBullet, makeEnemyBullet } from './bullet.js';
import { Enemy } from './enemy.js';

export class Boss {
    constructor(level, difficulty) {
        const bossIdx = (level - 1) % BOSSES.length;
        const loopCount = Math.floor((level - 1) / BOSSES.length);
        const cfg = BOSSES[bossIdx];
        const d = DIFFICULTY[difficulty];
        this.name = cfg.name + (loopCount > 0 ? ` · ${loopCount + 1}` : '');
        this.level = level;
        this.width = cfg.width;
        this.height = cfg.height;
        const baseHp = Math.round(cfg.maxHp * (0.85 + (d.enemyHpMul - 1) * 0.6));
        this.maxHp = Math.round(baseHp * Math.pow(1.5, loopCount));
        this.hp = this.maxHp;
        this.color = cfg.color;
        this.skills = cfg.skills;
        this.skillInterval = Math.max(400, cfg.skillIntervalMs * Math.pow(0.85, loopCount));
        this.enterY = cfg.enterY;
        this.x = WIDTH / 2;
        this.y = -this.height;
        this.vx = 0;
        this.vy = 0;
        this.state = 'enter'; // enter / fight / dead
        this.tick = 0;
        this.skillTimer = 0;
        this.flash = 0;
        this.dead = false;
        this.deathTimer = 0;
        // 技能状态
        this.dashDir = 0;
        this.dashTimer = 0;
        this.laserTimer = 0;
        this.laserActive = 0;
        this.laserX = 0;
        this.summonTimer = 0;
        this.phase = 1;
        // 输出给引擎的子弹/小怪
        this.spawnedBullets = [];
        this.spawnedEnemies = [];
    }

    update(dt, player) {
        this.tick++;
        if (this.flash > 0) this.flash--;

        if (this.state === 'enter') {
            this.y += 1.5;
            if (this.y >= this.enterY) {
                this.y = this.enterY;
                this.state = 'fight';
                this.vx = 1.2;
            }
            return;
        }

        if (this.state === 'dead') {
            this.deathTimer++;
            return;
        }

        // 阶段切换：血量低于 50% 进入阶段 2，攻击更激进
        const hpRatio = this.hp / this.maxHp;
        if (hpRatio < 0.5 && this.phase === 1) {
            this.phase = 2;
        }

        // 横向摆动
        this.x += this.vx * (this.phase === 2 ? 1.4 : 1);
        if (this.x < this.width / 2 + 10) { this.x = this.width / 2 + 10; this.vx = Math.abs(this.vx); }
        if (this.x > WIDTH - this.width / 2 - 10) { this.x = WIDTH - this.width / 2 - 10; this.vx = -Math.abs(this.vx); }

        // dash 技能状态中
        if (this.dashTimer > 0) {
            this.dashTimer--;
            this.y += this.dashDir * 2.2;
            if (this.y < this.enterY) { this.y = this.enterY; this.dashDir = 1; }
            if (this.y > this.enterY + 120) { this.y = this.enterY + 120; this.dashDir = -1; }
            if (this.dashTimer === 0) { this.y = this.enterY; this.dashDir = 0; }
        }

        // 激光技能激活期
        if (this.laserActive > 0) this.laserActive--;

        // 技能定时
        this.skillTimer += dt;
        const interval = this.phase === 2 ? this.skillInterval * 0.7 : this.skillInterval;
        if (this.skillTimer >= interval && this.dashTimer === 0) {
            this.skillTimer = 0;
            this._castSkill(player);
        }
    }

    _castSkill(player) {
        // 阶段 2 时随机多释放一个技能
        const skill = this.skills[Math.floor(Math.random() * this.skills.length)];
        this._executeSkill(skill, player);
        if (this.phase === 2 && Math.random() < 0.5) {
            const other = this.skills[(this.skills.indexOf(skill) + 1) % this.skills.length];
            this._executeSkill(other, player);
        }
    }

    _executeSkill(skill, player) {
        switch (skill) {
            case 'scatter': {
                // 扇形散射弹幕
                const count = this.phase === 2 ? 9 : 7;
                const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);
                for (let i = 0; i < count; i++) {
                    const a = baseAngle + (i - (count - 1) / 2) * 0.22;
                    this.spawnedBullets.push(makeEnemyBullet(
                        this.x, this.y + this.height / 2,
                        Math.cos(a) * 3.2, Math.sin(a) * 3.2,
                        this.color, 9,
                    ));
                }
                break;
            }
            case 'dash': {
                // 定向冲刺，期间无敌且移动
                this.dashTimer = 70;
                this.dashDir = 1;
                // 额外发射两束直弹
                for (let i = -1; i <= 1; i += 2) {
                    this.spawnedBullets.push(makeEnemyBullet(
                        this.x + i * 30, this.y + this.height / 2,
                        i * 1.5, 4, '#fff200', 10,
                    ));
                }
                break;
            }
            case 'laser': {
                // 横向激光预警后发射
                this.laserTimer = 60;
                this.laserX = this.x;
                this.laserActive = 45;
                break;
            }
            case 'missile': {
                // 跟踪导弹：3 发朝玩家
                for (let i = -1; i <= 1; i++) {
                    this.spawnedBullets.push(aimBullet(
                        this.x + i * 40, this.y + this.height / 2,
                        player.x, player.y,
                        2.6, '#ff6a00', 10,
                    ));
                }
                break;
            }
            case 'summon': {
                // 召唤 2 个小怪
                for (let i = 0; i < 2; i++) {
                    const e = new Enemy('basic', 1.5, 1.0);
                    e.x = this.x + (i === 0 ? -40 : 40);
                    e.y = this.y + this.height / 2;
                    e.startX = e.x;
                    this.spawnedEnemies.push(e);
                }
                break;
            }
            case 'homing': {
                // 追踪弹：4 发分散追踪
                for (let i = 0; i < 4; i++) {
                    const a = (Math.PI * 2 * i) / 4 + Math.random() * 0.3;
                    this.spawnedBullets.push(makeEnemyBullet(
                        this.x, this.y + this.height / 2,
                        Math.cos(a) * 2, Math.sin(a) * 2 + 1.5,
                        '#b026ff', 10,
                    ));
                }
                break;
            }
            case 'bulletstorm': {
                // 全屏环形弹幕
                const count = 14;
                const offset = this.tick * 0.1;
                for (let i = 0; i < count; i++) {
                    const a = (Math.PI * 2 * i) / count + offset;
                    this.spawnedBullets.push(makeEnemyBullet(
                        this.x, this.y,
                        Math.cos(a) * 2.4, Math.sin(a) * 2.4,
                        '#ff2e88', 8,
                    ));
                }
                break;
            }
        }
    }

    // 引擎每帧取走生成的子弹与小怪
    collectSpawns() {
        const b = this.spawnedBullets;
        const e = this.spawnedEnemies;
        this.spawnedBullets = [];
        this.spawnedEnemies = [];
        return { bullets: b, enemies: e };
    }

    damage(amount = 1) {
        if (this.state === 'dead') return false;
        this.hp -= amount;
        this.flash = 3;
        if (this.hp <= 0) {
            this.hp = 0;
            this.state = 'dead';
            this.dead = true;
            return true;
        }
        return false;
    }

    // 是否已被击杀且死亡动画结束
    isDeathDone() {
        return this.state === 'dead' && this.deathTimer > 50;
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            w: this.width,
            h: this.height,
        };
    }

    // 激光碰撞框（横向激光）
    getLaserBounds() {
        if (this.laserActive <= 0) return null;
        return { x: 0, y: this.y - 4, w: WIDTH, h: 8 };
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const flashing = this.flash > 0;
        ctx.shadowBlur = 18;
        ctx.shadowColor = this.color;
        ctx.fillStyle = flashing ? '#ffffff' : this.color;

        // 通用 Boss 外形：菱形大舰 + 装饰
        const w = this.width, h = this.height;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w / 2, h / 4);
        ctx.lineTo(w / 2.2, -h / 2);
        ctx.lineTo(-w / 2.2, -h / 2);
        ctx.lineTo(-w / 2, h / 4);
        ctx.closePath();
        ctx.fill();

        // 中心核心
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ffffff';
        ctx.fillStyle = flashing ? this.color : '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, w / 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.color;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(0, 0, w / 10, 0, Math.PI * 2);
        ctx.fill();

        // 侧翼
        ctx.fillStyle = flashing ? '#ffffff' : this.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.fillRect(-w / 2 - 8, -h / 6, 10, h / 2);
        ctx.fillRect(w / 2 - 2, -h / 6, 10, h / 2);

        // 阶段 2 标识：旋转光环
        if (this.phase === 2) {
            ctx.strokeStyle = '#fff200';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 14;
            ctx.shadowColor = '#fff200';
            ctx.beginPath();
            const r = w / 2 + 8 + Math.sin(this.tick * 0.1) * 3;
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();

        // 激光渲染
        if (this.laserActive > 0) {
            ctx.save();
            const alpha = this.laserActive > 20 ? 1 : this.laserActive / 20;
            ctx.globalAlpha = alpha;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ff2e88';
            ctx.fillStyle = '#ff2e88';
            ctx.fillRect(0, this.y - 4, WIDTH, 8);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, this.y - 1.5, WIDTH, 3);
            ctx.restore();
        } else if (this.laserTimer > 0) {
            // 预警虚线
            ctx.save();
            ctx.globalAlpha = 0.5 + Math.sin(this.tick * 0.5) * 0.3;
            ctx.strokeStyle = '#ff2e88';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.moveTo(0, this.y);
            ctx.lineTo(WIDTH, this.y);
            ctx.stroke();
            ctx.restore();
            this.laserTimer--;
        }
    }
}
