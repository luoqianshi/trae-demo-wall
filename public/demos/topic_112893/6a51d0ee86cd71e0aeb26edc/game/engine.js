// ===================================================================
// engine.js - 游戏引擎核心
// 负责：游戏循环、状态机、碰撞检测、实体管理、HUD 同步、场景渲染
// ===================================================================

import {
    WIDTH, HEIGHT, DIFFICULTY, WEAPONS, BOSSES, SCORE, STARS_LAYERS, PLAYER, LEVELS,
} from './config.js';
import { Input } from './input.js';
import { Player } from './player.js';
import { Enemy, EnemySpawner } from './enemy.js';
import { Boss } from './boss.js';
import { Bullet } from './bullet.js';
import { RewardSpawner } from './powerup.js';
import { ParticleSystem } from './particle.js';

// AABB 矩形碰撞
function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export class Game {
    constructor(canvas, ui) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ui = ui; // UI 元素引用集合

        this.input = new Input();
        this.particles = new ParticleSystem(280);

        // 游戏状态
        this.scene = 'menu'; // menu/playing/paused/boss/clear/gameover/victory
        this.difficulty = 'normal';
        this.level = 1;
        this.maxLevel = LEVELS.total;
        this.score = 0;
        this.highScore = Number(localStorage.getItem('neon-strike-high') || 0);

        // 实体集合
        this.player = null;
        this.enemies = [];
        this.bullets = [];      // 玩家子弹
        this.enemyBullets = []; // 敌方子弹
        this.boss = null;
        this.rewards = [];
        this.powerups = [];
        this.spawner = null;
        this.rewardSpawner = null;

        // 星空背景
        this.stars = [];
        this._initStars();

        // 计时
        this.lastTime = 0;
        this.clearTimer = 0;
        this.warningTimer = 0;
        this.bossPending = false;

        this._bindUI();
        this._syncHud();
    }

    _initStars() {
        this.stars = STARS_LAYERS.map(layer => {
            const arr = [];
            for (let i = 0; i < layer.count; i++) {
                arr.push({
                    x: Math.random() * WIDTH,
                    y: Math.random() * HEIGHT,
                });
            }
            return { ...layer, stars: arr };
        });
    }

    _bindUI() {
        // 难度按钮
        this.ui.diffBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.ui.diffBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.difficulty = btn.dataset.diff;
                this._syncHud();
            });
        });
        // 开始按钮
        this.ui.btnStart.addEventListener('click', () => this.startGame());
        this.ui.btnRetry.addEventListener('click', () => this.startGame());
        this.ui.btnVictory.addEventListener('click', () => this.startGame());
        
        // 通关覆盖层点击事件
        this.ui.overlayClear.addEventListener('click', () => {
            if (this.scene === 'clear') {
                if (this.level >= this.maxLevel) {
                    this._victory();
                } else {
                    this.level++;
                    this._startLevel();
                }
            }
        });
    }

    // 开始新游戏
    startGame() {
        this.level = 1;
        this.score = 0;
        this.scene = 'playing';
        this._hideAllOverlays();
        this._startLevel();
    }

    _startLevel() {
        const d = DIFFICULTY[this.difficulty];
        this.player = new Player();
        this.player.setHp(d.playerHp);
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.boss = null;
        this.rewards = [];
        this.powerups = [];
        this.particles.clear();
        this.killCount = 0;
        this.killTarget = LEVELS.bossScore;
        this.bossPending = false;
        this.warningTimer = 0;

        this.spawner = new EnemySpawner(this.difficulty, this.level);
        this.rewardSpawner = new RewardSpawner();
        this.scene = 'playing';
        this.ui.overlayClear.classList.add('hidden');
        this._syncHud();
    }

    // ===== 主循环 =====
    loop = (time) => {
        const dt = Math.min(50, time - this.lastTime);
        this.lastTime = time;

        if (this.scene === 'paused') {
            // 暂停时仍渲染但不更新
            this._handlePauseToggle();
            this.render();
            this.input.endFrame();
            requestAnimationFrame(this.loop);
            return;
        }

        if (this.scene !== 'menu') {
            this.update(dt);
        }
        this._handlePauseToggle();
        this.render();
        this.input.endFrame();
        requestAnimationFrame(this.loop);
    };

    _handlePauseToggle() {
        if (this.input.consumePause()) {
            if (this.scene === 'playing' || this.scene === 'boss') {
                this._sceneBeforePause = this.scene;
                this.scene = 'paused';
                this.ui.overlayPause.classList.remove('hidden');
            } else if (this.scene === 'paused') {
                this.scene = this._sceneBeforePause || 'playing';
                this.ui.overlayPause.classList.add('hidden');
            }
        }
    }

    // ===== 更新逻辑 =====
    update(dt) {
        // 星空滚动
        this._updateStars();

        if (this.scene === 'playing' || this.scene === 'boss') {
            this._updatePlayer(dt);
            this._updateBullets();
            this._updateEnemyBullets();
            this._updateEnemies(dt);
            this._updateRewards(dt);
            this._updatePowerups();
            this._updateBoss(dt);
            this._checkCollisions();
            this.particles.update();

            // 玩家死亡：尝试复活（消耗一条命），命数耗尽则 Game Over
            if (this.player.dead) {
                if (this.player.lives > 0) {
                    this.player.respawn();
                    this.particles.explode(this.player.x, this.player.y, '#00f0ff', 30, 5);
                    this._syncHud();
                } else {
                    this._gameOver();
                    return;
                }
            }
        }

        if (this.scene === 'clear') {
            this.particles.update();
        }
    }

    _updateStars() {
        for (const layer of this.stars) {
            for (const s of layer.stars) {
                s.y += layer.speed;
                if (s.y > HEIGHT) {
                    s.y = -2;
                    s.x = Math.random() * WIDTH;
                }
            }
        }
    }

    _updatePlayer(dt) {
        this.player.update(this.input);
        // 引擎尾焰粒子
        if (this.player.engineTick % 2 === 0) {
            const trails = this.player.getTrailPositions();
            for (const t of trails) {
                this.particles.trail(t.x, t.y, '#00f0ff', 0, 2.5);
            }
        }
        // 自动开火
        const newBullets = this.player.fire();
        this.bullets.push(...newBullets);
    }

    _updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.update();
            if (b.dead || b.isOffscreen(WIDTH, HEIGHT)) {
                this.bullets.splice(i, 1);
            }
        }
    }

    _updateEnemyBullets() {
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const b = this.enemyBullets[i];
            b.update();
            if (b.dead || b.isOffscreen(WIDTH, HEIGHT)) {
                this.enemyBullets.splice(i, 1);
            }
        }
    }

    _updateEnemies(dt) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(this.player.x, this.player.y);
            if (e.dead) {
                if (e.hp <= 0) {
                    this.score += e.score;
                    this.killCount++;
                    this.particles.explode(e.x, e.y, e.color, 16, 3.5);
                    this._syncHud();
                }
                this.enemies.splice(i, 1);
            }
        }

        // 生成新敌机（仅普通关卡阶段）
        if (this.scene === 'playing' && !this.bossPending) {
            const newOnes = this.spawner.spawn(dt);
            this.enemies.push(...newOnes);

            // 奖励飞机
            const reward = this.rewardSpawner.spawn(dt);
            if (reward) this.rewards.push(reward);

            // 达成击杀目标 -> 触发 Boss
            if (this.killCount >= this.killTarget) {
                this.bossPending = true;
                this.spawner.setActive(false);
                this.rewardSpawner.setActive(false);
                this.warningTimer = 180; // 3 秒警告
                this.scene = 'boss';
                this.ui.overlayWarning.classList.remove('hidden');
                this.ui.warningBossName.textContent = BOSSES[this.level - 1].name;
            }
        }
    }

    _updateRewards(dt) {
        for (let i = this.rewards.length - 1; i >= 0; i--) {
            const r = this.rewards[i];
            r.update();
            if (r.dead) {
                if (r.hp <= 0) {
                    this.score += SCORE.reward;
                    this.particles.explode(r.x, r.y, r.color, 22, 4);
                    this.powerups.push(r.dropPowerup());
                    this._syncHud();
                }
                this.rewards.splice(i, 1);
            }
        }
    }

    _updatePowerups() {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            p.update();
            if (p.dead) this.powerups.splice(i, 1);
        }
    }

    _updateBoss(dt) {
        if (this.scene !== 'boss' && this.scene !== 'clear') return;

        // 警告倒计时
        if (this.warningTimer > 0) {
            this.warningTimer--;
            if (this.warningTimer === 0) {
                this.ui.overlayWarning.classList.add('hidden');
                this.boss = new Boss(this.level, this.difficulty);
                this.ui.bossHp.classList.remove('hidden');
                this.ui.bossName.textContent = this.boss.name;
            }
            return;
        }

        if (!this.boss) return;

        this.boss.update(dt, this.player);
        const spawns = this.boss.collectSpawns();
        this.enemyBullets.push(...spawns.bullets);
        this.enemies.push(...spawns.enemies);

        // Boss 死亡
        if (this.boss.isDeathDone()) {
            this.score += SCORE.boss;
            this.ui.bossHp.classList.add('hidden');
            this.boss = null;
            this.scene = 'clear';
            this.clearTimer = 2200;
            this.ui.overlayClear.classList.remove('hidden');
            this.ui.clearSub.textContent = this.level >= this.maxLevel ? '即将通关' : `进入第 ${this.level + 1} 关`;
            this._syncHud();
        } else {
            this._syncBossHud();
        }
    }

    // ===== 碰撞检测 =====
    _checkCollisions() {
        const pBounds = this.player.getBounds();

        // 玩家子弹 vs 敌机
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            const bBounds = { x: b.x - b.width / 2, y: b.y - b.height / 2, w: b.width, h: b.height };

            // vs 普通敌机
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const e = this.enemies[j];
                if (b.hitSet.has(e)) continue;
                if (aabb(bBounds, e.getBounds())) {
                    const killed = e.damage(b.damage);
                    this.particles.hit(b.x, b.y, e.color, 5);
                    if (killed) {
                        this.score += e.score;
                        this.killCount++;
                        this.particles.explode(e.x, e.y, e.color, 16, 3.5);
                        this.enemies.splice(j, 1);
                        this._syncHud();
                    }
                    if (b.pierce > 0) {
                        b.pierce--;
                        b.hitSet.add(e);
                    } else {
                        b.dead = true;
                    }
                    break;
                }
            }

            if (b.dead) { this.bullets.splice(i, 1); continue; }

            // vs 奖励飞机
            for (let j = this.rewards.length - 1; j >= 0; j--) {
                const r = this.rewards[j];
                if (b.hitSet.has(r)) continue;
                if (aabb(bBounds, r.getBounds())) {
                    const killed = r.damage(b.damage);
                    this.particles.hit(b.x, b.y, r.color, 6);
                    if (killed) {
                        this.score += SCORE.reward;
                        this.particles.explode(r.x, r.y, r.color, 22, 4);
                        this.powerups.push(r.dropPowerup());
                        this.rewards.splice(j, 1);
                        this._syncHud();
                    }
                    if (b.pierce > 0) {
                        b.pierce--;
                        b.hitSet.add(r);
                    } else {
                        b.dead = true;
                    }
                    break;
                }
            }

            if (b.dead) { this.bullets.splice(i, 1); continue; }

            // vs Boss
            if (this.boss && this.boss.state !== 'dead' && !b.hitSet.has(this.boss)) {
                if (aabb(bBounds, this.boss.getBounds())) {
                    const killed = this.boss.damage(b.damage);
                    this.particles.hit(b.x, b.y, this.boss.color, 6);
                    if (killed) {
                        this.particles.explode(this.boss.x, this.boss.y, this.boss.color, 40, 6);
                    }
                    if (b.pierce > 0) {
                        b.pierce--;
                        b.hitSet.add(this.boss);
                    } else {
                        b.dead = true;
                    }
                }
            }

            if (b.dead) { this.bullets.splice(i, 1); }
        }

        // 敌方子弹 vs 玩家
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const b = this.enemyBullets[i];
            const bBounds = { x: b.x - b.width / 2, y: b.y - b.height / 2, w: b.width, h: b.height };
            if (aabb(bBounds, pBounds)) {
                if (this.player.damage(1)) {
                    this.particles.explode(this.player.x, this.player.y, '#00f0ff', 16, 3);
                    this._syncHud();
                }
                this.enemyBullets.splice(i, 1);
                if (this.player.dead) return;
            }
        }

        // 敌机 vs 玩家
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (aabb(e.getBounds(), pBounds)) {
                if (this.player.damage(1)) {
                    this.particles.explode(e.x, e.y, e.color, 16, 3.5);
                    this.enemies.splice(i, 1);
                    this._syncHud();
                }
                if (this.player.dead) return;
                break;
            }
        }

        // Boss vs 玩家
        if (this.boss && this.boss.state !== 'dead') {
            if (aabb(this.boss.getBounds(), pBounds)) {
                if (this.player.damage(1)) {
                    this.particles.explode(this.player.x, this.player.y, '#00f0ff', 16, 3);
                    this._syncHud();
                }
            }
            // Boss 激光 vs 玩家
            const laser = this.boss.getLaserBounds();
            if (laser && aabb(laser, pBounds)) {
                if (this.player.damage(1)) {
                    this.particles.explode(this.player.x, this.player.y, '#ff2e88', 16, 3);
                    this._syncHud();
                }
            }
        }

        // 道具 vs 玩家
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            if (aabb(p.getBounds(), pBounds)) {
                this.player.addWeapon(p.weapon);
                this.particles.explode(p.x, p.y, p.cfg.color, 14, 3);
                this.powerups.splice(i, 1);
                this._syncHud();
            }
        }
    }

    // ===== 结局 =====
    _gameOver() {
        this.scene = 'gameover';
        const isRecord = this.score > this.highScore;
        if (isRecord) {
            this.highScore = this.score;
            localStorage.setItem('neon-strike-high', String(this.highScore));
        }
        this.ui.overScore.textContent = this.score;
        this.ui.overRecord.classList.toggle('hidden', !isRecord);
        this.ui.overlayOver.classList.remove('hidden');
        this.ui.bossHp.classList.add('hidden');
        this._syncHud();
    }

    _victory() {
        this.scene = 'victory';
        this.score += SCORE.clearBonus;
        const isRecord = this.score > this.highScore;
        if (isRecord) {
            this.highScore = this.score;
            localStorage.setItem('neon-strike-high', String(this.highScore));
        }
        this.ui.vicScore.textContent = this.score;
        this.ui.vicRecord.classList.toggle('hidden', !isRecord);
        this.ui.overlayVictory.classList.remove('hidden');
        this.ui.overlayClear.classList.add('hidden');
        this._syncHud();
    }

    _hideAllOverlays() {
        this.ui.overlayMenu.classList.add('hidden');
        this.ui.overlayWarning.classList.add('hidden');
        this.ui.overlayClear.classList.add('hidden');
        this.ui.overlayPause.classList.add('hidden');
        this.ui.overlayOver.classList.add('hidden');
        this.ui.overlayVictory.classList.add('hidden');
        this.ui.bossHp.classList.add('hidden');
    }

    showMenu() {
        this.scene = 'menu';
        this._hideAllOverlays();
        this.ui.overlayMenu.classList.remove('hidden');
        this._syncHud();
    }

    // ===== HUD 同步 =====
    _syncHud() {
        if (!this.player) {
            this.ui.level.textContent = '01';
            this.ui.score.textContent = this.score;
            this.ui.high.textContent = this.highScore;
            this.ui.weapon.textContent = 'N · LV1';
            this.ui.diff.textContent = DIFFICULTY[this.difficulty].name;
            this.ui.killFill.style.width = '0%';
            this.ui.killText.textContent = `0 / ${DIFFICULTY[this.difficulty].killTarget}`;
            this.ui.hpFill.style.width = '100%';
            this.ui.hpText.textContent = '- / -';
            return;
        }
        this.ui.level.textContent = String(this.level).padStart(2, '0');
        this.ui.score.textContent = this.score;
        this.ui.high.textContent = Math.max(this.highScore, this.score);
        const primary = this.player.getPrimaryWeaponName();
        const primaryLv = this.player.getPrimaryWeaponLevel();
        this.ui.weapon.textContent = `${primary} · LV${primaryLv}`;
        this.ui.diff.textContent = DIFFICULTY[this.difficulty].name;

        const killPct = Math.min(100, (this.killCount / this.killTarget) * 100);
        this.ui.killFill.style.width = killPct + '%';
        this.ui.killText.textContent = `${this.killCount} / ${this.killTarget}`;

        const hpPct = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
        this.ui.hpFill.style.width = hpPct + '%';
        this.ui.hpText.textContent = `${this.player.hp} / ${this.player.maxHp}`;
    }

    _syncBossHud() {
        if (!this.boss) return;
        const pct = Math.max(0, (this.boss.hp / this.boss.maxHp) * 100);
        this.ui.bossFill.style.width = pct + '%';
    }

    // ===== 渲染 =====
    render() {
        const ctx = this.ctx;
        // 背景
        ctx.fillStyle = '#0a0118';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        this._renderStars();
        this._renderGrid();

        if (this.scene === 'menu') {
            this._renderMenuBg();
            return;
        }

        // 敌方子弹
        for (const b of this.enemyBullets) b.render(ctx);
        // 敌机
        for (const e of this.enemies) e.render(ctx);
        // 奖励飞机
        for (const r of this.rewards) r.render(ctx);
        // Boss
        if (this.boss) this.boss.render(ctx);
        // 玩家子弹
        for (const b of this.bullets) b.render(ctx);
        // 玩家
        if (this.player && !this.player.dead) this.player.render(ctx);
        // 道具
        for (const p of this.powerups) p.render(ctx);
        // 粒子
        this.particles.render(ctx);

        // Canvas 内 HUD
        this._renderCanvasHud(ctx);

        // 菜单时显示，否则保持隐藏
        if (this.scene === 'menu') this.ui.overlayMenu.classList.remove('hidden');
    }

    _renderStars() {
        const ctx = this.ctx;
        for (const layer of this.stars) {
            ctx.fillStyle = layer.color;
            for (const s of layer.stars) {
                ctx.fillRect(s.x, s.y, layer.size, layer.size);
            }
        }
    }

    // 远景透视网格地平线
    _renderGrid() {
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = 'rgba(176, 38, 255, 0.15)';
        ctx.lineWidth = 1;
        const offset = (performance.now() * 0.05) % 40;
        for (let y = -40 + offset; y < HEIGHT; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(WIDTH, y);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Canvas 内 HUD：左上角命数、右上角血量、左下武器列表
    _renderCanvasHud(ctx) {
        if (!this.player) return;

        // === 左上角：剩余命数 ===
        ctx.save();
        ctx.font = 'bold 10px "Press Start 2P", monospace';
        ctx.fillStyle = '#6b5b8a';
        ctx.textAlign = 'left';
        ctx.fillText('LIVES', 12, 22);

        // 用小飞机图标表示命数
        for (let i = 0; i < this.player.lives; i++) {
            const ix = 12 + i * 26;
            const iy = 34;
            ctx.save();
            ctx.translate(ix + 10, iy + 10);
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#00f0ff';
            ctx.fillStyle = '#00f0ff';
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.lineTo(8, 6);
            ctx.lineTo(-8, 6);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();

        // === 右上角：玩家血量条 ===
        ctx.save();
        ctx.font = 'bold 10px "Press Start 2P", monospace';
        ctx.fillStyle = '#6b5b8a';
        ctx.textAlign = 'right';
        ctx.fillText('HULL', WIDTH - 12, 22);

        const hpBarW = 120;
        const hpBarH = 10;
        const hpBarX = WIDTH - 12 - hpBarW;
        const hpBarY = 28;

        // 背景
        ctx.fillStyle = 'rgba(57, 255, 20, 0.12)';
        ctx.strokeStyle = 'rgba(57, 255, 20, 0.6)';
        ctx.lineWidth = 1;
        ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);
        ctx.strokeRect(hpBarX + 0.5, hpBarY + 0.5, hpBarW - 1, hpBarH - 1);

        // 血量
        const hpRatio = Math.max(0, this.player.hp / this.player.maxHp);
        const hpColor = hpRatio > 0.5 ? '#39ff14' : (hpRatio > 0.25 ? '#fff200' : '#ff2e88');
        ctx.fillStyle = hpColor;
        ctx.shadowBlur = 6;
        ctx.shadowColor = hpColor;
        ctx.fillRect(hpBarX, hpBarY, hpBarW * hpRatio, hpBarH);
        ctx.shadowBlur = 0;

        // 数字
        ctx.fillStyle = hpColor;
        ctx.font = 'bold 9px "Press Start 2P", monospace';
        ctx.fillText(`${this.player.hp}/${this.player.maxHp}`, WIDTH - 12, 52);
        ctx.restore();

        // === 左下角：激活武器列表 ===
        const weapons = this.player.getActiveWeapons();
        if (weapons.length > 1 || (weapons.length === 1 && weapons[0].weapon !== 'N')) {
            ctx.save();
            ctx.font = 'bold 9px "Press Start 2P", monospace';
            ctx.fillStyle = '#6b5b8a';
            ctx.textAlign = 'left';
            ctx.fillText('WEAPONS', 12, HEIGHT - 18);

            const sorted = [...weapons].sort((a, b) => a.weapon.localeCompare(b.weapon));
        sorted.forEach((w, i) => {
            const wx = 12 + i * 36;
            const wy = HEIGHT - 14;
            const cfg = WEAPONS[w.weapon];
            ctx.fillStyle = cfg.color;
            ctx.shadowBlur = 4;
            ctx.shadowColor = cfg.glow;
            ctx.font = 'bold 9px "Press Start 2P", monospace';
            const power = this.player.getWeaponPower(w.weapon);
            const powerTag = power >= 3 ? '+' : (power >= 2 ? '*' : '');
            ctx.fillText(`${w.weapon}${w.level}${powerTag}`, wx, wy + 14);
        });
            ctx.restore();
        }

        // === 底部窄进度条：当前关卡击杀进度 ===
        ctx.save();
        const barW = WIDTH;
        const barH = 2;
        const barY = HEIGHT - barH - 1;
        ctx.fillStyle = 'rgba(176, 38, 255, 0.1)';
        ctx.fillRect(0, barY, barW, barH);
        const progress = Math.min(1, this.killCount / this.killTarget);
        const fillW = barW * progress;
        ctx.fillStyle = '#b026ff';
        ctx.shadowBlur = 3;
        ctx.shadowColor = '#b026ff';
        ctx.fillRect(0, barY, fillW, barH);
        ctx.restore();
    }

    _renderMenuBg() {
        // 菜单时画一些装饰流星
        const ctx = this.ctx;
        ctx.save();
        for (const layer of this.stars) {
            ctx.fillStyle = layer.color;
            for (const s of layer.stars) {
                ctx.fillRect(s.x, s.y, layer.size, layer.size);
            }
        }
        ctx.restore();
    }
}
