// ===================================================================
// player.js - 玩家战机
// 方向键移动、自动连射、武器叠加（多武器同时开火）、命数系统、受伤无敌帧
// ===================================================================

import { PLAYER, WEAPONS, WIDTH, HEIGHT } from './config.js';
import { spawnPlayerBullets } from './bullet.js';

export class Player {
    constructor() {
        this.width = PLAYER.width;
        this.height = PLAYER.height;
        this.x = WIDTH / 2;
        this.y = HEIGHT - 100;
        this.maxHp = 3;
        this.hp = this.maxHp;
        this.speed = PLAYER.speed;

        this.weapons = { N: 1 };
        this.weaponPower = {};
        this.primaryWeapon = 'N';

        // 各武器独立冷却（实现不同射速叠加）
        this.cooldowns = {};
        for (const w of Object.keys(WEAPONS)) {
            this.cooldowns[w] = 0;
        }

        this.invincible = 0;
        this.dead = false;
        this.engineTick = 0;

        // 命数
        this.lives = 3;
    }

    setHp(hp) {
        this.maxHp = hp;
        this.hp = hp;
    }

    setLives(n) {
        this.lives = n;
    }

    // 应用输入：移动
    update(input) {
        let dx = 0, dy = 0;
        if (input.left) dx -= 1;
        if (input.right) dx += 1;
        if (input.up) dy -= 1;
        if (input.down) dy += 1;
        if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
        }
        this.x += dx * this.speed;
        this.y += dy * this.speed;

        const halfW = this.width / 2;
        const halfH = this.height / 2;
        this.x = Math.max(halfW, Math.min(WIDTH - halfW, this.x));
        this.y = Math.max(halfH, Math.min(HEIGHT - halfH, this.y));

        // 各武器冷却递减
        for (const w of Object.keys(this.weapons)) {
            if (this.cooldowns[w] > 0) this.cooldowns[w]--;
        }
        if (this.invincible > 0) this.invincible--;
        this.engineTick++;
    }

    // 所有已获得武器同时开火
    fire() {
        if (this.dead) return [];
        const allBullets = [];
        for (const [weapon, level] of Object.entries(this.weapons)) {
            if (this.cooldowns[weapon] > 0) continue;
            const cfg = WEAPONS[weapon];
            this.cooldowns[weapon] = Math.round(cfg.fireInterval / (1000 / 60));
            const bullets = spawnPlayerBullets(weapon, level, this.x, this.y - this.height / 2);
            const damageMul = this.getWeaponDamageMul(weapon);
            for (const b of bullets) {
                b.damage = Math.round(b.damage * damageMul);
            }
            allBullets.push(...bullets);
        }
        return allBullets;
    }

    addWeapon(w) {
        if (this.weapons[w] !== undefined) {
            if (this.weapons[w] < PLAYER.maxWeaponLevel) {
                this.weapons[w]++;
            }
        } else {
            this.weapons[w] = 1;
        }
        this.weaponPower[w] = (this.weaponPower[w] || 0) + 1;
        this._updatePrimary();
    }

    getWeaponPower(w) {
        return this.weaponPower[w] || 0;
    }

    getWeaponDamageMul(w) {
        const pickups = this.getWeaponPower(w);
        if (pickups >= 3) return 1.5;
        if (pickups >= 2) return 1.2;
        return 1.0;
    }

    _updatePrimary() {
        // 主武器 = 等级最高的那把（等级相同则按字母顺序）
        let best = 'N';
        let bestLv = 0;
        for (const [w, lv] of Object.entries(this.weapons)) {
            if (lv > bestLv || (lv === bestLv && w < best)) {
                best = w;
                bestLv = lv;
            }
        }
        this.primaryWeapon = best;
    }

    getPrimaryWeaponName() {
        return this.primaryWeapon;
    }

    getPrimaryWeaponLevel() {
        return this.weapons[this.primaryWeapon] || 1;
    }

    // 获取所有激活的武器列表（用于 HUD 显示）
    getActiveWeapons() {
        return Object.entries(this.weapons).map(([w, lv]) => ({ weapon: w, level: lv }));
    }

    // 受伤
    damage(amount = 1) {
        if (this.invincible > 0 || this.dead) return false;
        this.hp -= amount;
        this.invincible = PLAYER.invincibleFrames;
        if (this.hp <= 0) {
            this.hp = 0;
            this.dead = true;
        }
        return true;
    }

    // 消耗一条命并复活（如果还有命）
    respawn() {
        if (this.lives <= 0) return false;
        this.lives--;
        this.hp = this.maxHp;
        this.dead = false;
        this.invincible = PLAYER.invincibleFrames * 2;
        this.x = WIDTH / 2;
        this.y = HEIGHT - 100;
        // 复活时保留武器
        return true;
    }

    // 引擎尾焰位置
    getTrailPositions() {
        return [
            { x: this.x - 8, y: this.y + this.height / 2 - 4 },
            { x: this.x + 8, y: this.y + this.height / 2 - 4 },
        ];
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
        if (this.invincible > 0 && Math.floor(this.invincible / 4) % 2 === 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        const cfg = WEAPONS[this.primaryWeapon];

        // 引擎光晕
        ctx.shadowBlur = 14;
        ctx.shadowColor = '#00f0ff';

        // 机身：青色三角战机
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(this.width / 2, this.height / 2 - 4);
        ctx.lineTo(this.width / 4, this.height / 2);
        ctx.lineTo(-this.width / 4, this.height / 2);
        ctx.lineTo(-this.width / 2, this.height / 2 - 4);
        ctx.closePath();
        ctx.fill();

        // 机身高光
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#aaffff';
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2 + 4);
        ctx.lineTo(6, this.height / 2 - 6);
        ctx.lineTo(-6, this.height / 2 - 6);
        ctx.closePath();
        ctx.fill();

        // 驾驶舱（主武器颜色）
        ctx.fillStyle = cfg.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = cfg.glow;
        ctx.beginPath();
        ctx.ellipse(0, -2, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // 多武器时，周围显示一圈武器颜色小点
        const weaponKeys = Object.keys(this.weapons).filter(w => w !== 'N');
        if (weaponKeys.length > 0) {
            const n = weaponKeys.length;
            for (let i = 0; i < n; i++) {
                const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
                const px = Math.cos(angle) * 14;
                const py = Math.sin(angle) * 14;
                const wc = WEAPONS[weaponKeys[i]];
                ctx.fillStyle = wc.color;
                ctx.shadowBlur = 6;
                ctx.shadowColor = wc.glow;
                ctx.beginPath();
                ctx.arc(px, py, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }
}
