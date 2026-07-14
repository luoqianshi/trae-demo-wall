(function() {
    const WAVES = [
        { triggerTime: 20, enemies: [
            { type: 'enemy_gun', col: 5, row: 1 },
            { type: 'enemy_knife', col: 6, row: 3 }
        ]},
        { triggerTime: 45, enemies: [
            { type: 'enemy_gun', col: 4, row: 0 },
            { type: 'enemy_gun', col: 4, row: 2 },
            { type: 'enemy_knife', col: 6, row: 1 }
        ]},
        { triggerTime: 75, enemies: [
            { type: 'enemy_gun', col: 4, row: 1 },
            { type: 'enemy_gun', col: 4, row: 3 },
            { type: 'enemy_gun', col: 5, row: 2 },
            { type: 'enemy_knife', col: 6, row: 0 }
        ]},
        { triggerTime: 110, enemies: [
            { type: 'enemy_gun', col: 3, row: 0 },
            { type: 'enemy_gun', col: 3, row: 1 },
            { type: 'enemy_gun', col: 3, row: 2 },
            { type: 'enemy_gun', col: 3, row: 3 }
        ]}
    ];

    // 相克系数：爆发克肉盾(1.5)，远程克爆发(1.5)，肉盾克远程/远程打肉盾(0.5)
    function getCounterMultiplier(attackerType, defenderType) {
        if (attackerType === 'burst' && defenderType === 'tank') return 1.5;
        if (attackerType === 'ranged' && defenderType === 'burst') return 1.5;
        if (attackerType === 'ranged' && defenderType === 'tank') return 0.5;
        return 1.0;
    }

    class Bullet {
        constructor(x, y, targetX, targetY, damage, fromEnemy, isRanged, attackerType, targetUnit) {
            this.x = x;
            this.y = y;
            this.targetX = targetX;
            this.targetY = targetY;
            this.damage = damage;
            this.fromEnemy = fromEnemy;
            this.isRanged = isRanged;
            this.attackerType = attackerType || 'normal';
            this.targetUnit = targetUnit || null;
            this.speed = isRanged ? 400 : 300;
            this.dead = false;
            this.trail = [];

            const dx = targetX - x;
            const dy = targetY - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            this.vx = (dx / dist) * this.speed;
            this.vy = (dy / dist) * this.speed;
        }

        update(dt, game) {
            const dtSeconds = dt / 1000;

            // 追踪移动中的目标
            if (this.targetUnit && !this.targetUnit.dead) {
                this.targetX = this.targetUnit.x;
                this.targetY = this.targetUnit.y - 40;
            }

            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
                this.vx = (dx / dist) * this.speed;
                this.vy = (dy / dist) * this.speed;
            }

            if (this.isRanged) {
                this.trail.push({x: this.x, y: this.y});
                if (this.trail.length > 5) this.trail.shift();
            }

            this.x += this.vx * dtSeconds;
            this.y += this.vy * dtSeconds;

            // 命中判定：接近目标15px内即命中
            if (dist < 15) {
                this.dead = true;
                let hitUnit = this.targetUnit;

                // 若原目标已死亡，搜索附近其他目标作为fallback
                if (!hitUnit || hitUnit.dead) {
                    const targets = this.fromEnemy ? game.spirits : game.enemies;
                    let closest = null;
                    let closestDist = Infinity;
                    for (const t of targets) {
                        if (t.dead) continue;
                        const tdx = t.x - this.x;
                        const tdy = t.y - 40 - this.y;
                        const td = Math.sqrt(tdx * tdx + tdy * tdy);
                        if (td < closestDist && td < 40) {
                            closestDist = td;
                            closest = t;
                        }
                    }
                    hitUnit = closest;
                }

                if (hitUnit) {
                    const baseDmg = Math.max(1, Math.floor(this.damage * (100 / (100 + hitUnit.defense * 5))));
                    const counter = getCounterMultiplier(this.attackerType, hitUnit.unitType);
                    const dmg = Math.max(1, Math.floor(baseDmg * counter));
                    hitUnit.takeDamage(dmg);
                }
            }
        }

        render(ctx) {
            ctx.save();

            if (this.isRanged) {
                for (let i = 0; i < this.trail.length; i++) {
                    const t = this.trail[i];
                    const alpha = (i / this.trail.length) * 0.5;
                    const size = 2 + (i / this.trail.length) * 2;
                    ctx.beginPath();
                    ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
                    ctx.fillStyle = this.fromEnemy ?
                        `rgba(255, 100, 30, ${alpha})` :
                        `rgba(255, 215, 0, ${alpha})`;
                    ctx.fill();
                }

                ctx.beginPath();
                ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = this.fromEnemy ? '#ff5522' : '#ffd700';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(this.x, this.y, 7, 0, Math.PI * 2);
                ctx.fillStyle = this.fromEnemy ? 'rgba(255,80,20,0.4)' : 'rgba(255,200,0,0.4)';
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = this.fromEnemy ? '#ff4444' : '#ffd700';
                ctx.fill();
            }

            ctx.restore();
        }
    }

    class FloatText {
        constructor(x, y, text, color) {
            this.x = x;
            this.y = y;
            this.text = text;
            this.color = color;
            this.lifetime = 1000;
            this.age = 0;
            this.dead = false;
        }

        update(dt) {
            this.age += dt;
            this.y -= dt * 0.05;
            if (this.age >= this.lifetime) {
                this.dead = true;
            }
        }

        render(ctx) {
            const alpha = 1 - this.age / this.lifetime;
            ctx.save();
            ctx.font = 'bold 24px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = this.color;
            ctx.globalAlpha = alpha;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
            ctx.fillText(this.text, this.x, this.y);
            ctx.restore();
        }
    }

    class Orb {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.baseY = y;
            this.radius = 20;
            this.collected = false;
            this.absorbed = false;
            this.byPlayer = false;
            this.lifetime = 2000 + Math.random() * 1000;
            this.age = 0;
            this.floatOffset = 0;
            this.flicker = 0;
            this.particles = [];
            for (let i = 0; i < 6; i++) {
                this.particles.push({
                    ox: (Math.random() - 0.5) * 14,
                    oy: -this.radius - Math.random() * 18,
                    phase: Math.random() * Math.PI * 2,
                    speed: 0.5 + Math.random() * 0.5
                });
            }
            this.absorbTargetX = 80;
            this.absorbTargetY = 670;
            this.absorbProgress = 0;
        }

        update(dt) {
            this.age += dt;
            this.flicker += dt * 0.01;
            this.floatOffset = Math.sin(this.age / 300) * 6;
            this.y = this.baseY + this.floatOffset;

            if (this.absorbed) {
                this.absorbProgress += dt / 250;
                if (this.zengboTarget && !this.zengboTarget.dead) {
                    this.absorbTargetX = this.zengboTarget.x;
                    this.absorbTargetY = this.zengboTarget.y - 40;
                }
                this.x = this.x + (this.absorbTargetX - this.x) * 0.15;
                this.y = this.y + (this.absorbTargetY - this.y) * 0.15;
                if (this.absorbProgress >= 1) {
                    this.collected = true;
                    if (this.zengboTarget && window.game) {
                        window.game.onZengboAbsorb(this.zengboTarget);
                    }
                }
                return;
            }

            if (this.age >= this.lifetime) {
                this.setEnemyAbsorb();
            }
        }

        setPlayerCollect() {
            if (!this.collected && !this.absorbed) {
                this.absorbed = true;
                this.byPlayer = true;
                this.absorbTargetX = 80;
                this.absorbTargetY = 670;
                return 1;
            }
            return 0;
        }

        setEnemyAbsorb() {
            if (!this.collected && !this.absorbed) {
                this.absorbed = true;
                this.byPlayer = false;
                this.absorbTargetX = 1100;
                this.absorbTargetY = 40;
            }
        }

        setZengboAbsorb(spirit) {
            if (!this.collected && !this.absorbed && spirit) {
                this.absorbed = true;
                this.byPlayer = true;
                this.zengboTarget = spirit;
                this.absorbTargetX = spirit.x;
                this.absorbTargetY = spirit.y - 40;
                this.absorbProgress = 0;
                return 1;
            }
            return 0;
        }

        collect() {
            if (!this.collected && !this.absorbed) {
                return this.setPlayerCollect();
            }
            return 0;
        }

        absorbByEnemy() {
            if (!this.collected) {
                this.setEnemyAbsorb();
                return 1;
            }
            return 0;
        }

        containsPoint(px, py) {
            const dx = px - this.x;
            const dy = py - this.y;
            return dx * dx + dy * dy < 900;
        }

        render(ctx) {
            ctx.save();

            const px = Math.floor(this.x);
            const py = Math.floor(this.y);
            const flick = Math.sin(this.flicker) * 0.2 + 0.8;
            const isEnemyAbsorb = this.absorbed && !this.byPlayer;

            const glowRadius = this.radius * 3.5;
            const glow = ctx.createRadialGradient(px, py, 0, px, py, glowRadius);
            if (isEnemyAbsorb) {
                glow.addColorStop(0, `rgba(255, 80, 30, ${0.6 * flick})`);
                glow.addColorStop(0.4, `rgba(220, 50, 0, ${0.3 * flick})`);
                glow.addColorStop(1, 'rgba(150, 20, 0, 0)');
            } else {
                glow.addColorStop(0, `rgba(255, 200, 50, ${0.7 * flick})`);
                glow.addColorStop(0.4, `rgba(255, 140, 0, ${0.4 * flick})`);
                glow.addColorStop(1, 'rgba(200, 60, 0, 0)');
            }
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(px, py, glowRadius, 0, Math.PI * 2);
            ctx.fill();

            const pixelSize = 5;

            const flamePixels = [
                {dx: 0, dy: 0, c: '#FFFACD'},
                {dx: -1, dy: 0, c: '#FFF8DC'},
                {dx: 1, dy: 0, c: '#FFF8DC'},
                {dx: 0, dy: -1, c: '#FFE4B5'},
                {dx: -2, dy: 0, c: '#FFD700'},
                {dx: 2, dy: 0, c: '#FFD700'},
                {dx: -1, dy: -1, c: '#FFD700'},
                {dx: 1, dy: -1, c: '#FFD700'},
                {dx: 0, dy: -2, c: '#FFD700'},
                {dx: -3, dy: 0, c: '#DAA520'},
                {dx: 3, dy: 0, c: '#DAA520'},
                {dx: -2, dy: -1, c: '#DAA520'},
                {dx: 2, dy: -1, c: '#DAA520'},
                {dx: -1, dy: -2, c: '#DAA520'},
                {dx: 1, dy: -2, c: '#DAA520'},
                {dx: 0, dy: -3, c: '#FFA500'},
                {dx: -3, dy: -1, c: '#FF8C00'},
                {dx: 3, dy: -1, c: '#FF8C00'},
                {dx: -2, dy: -2, c: '#FF8C00'},
                {dx: 2, dy: -2, c: '#FF8C00'},
                {dx: -1, dy: -3, c: '#FF8C00'},
                {dx: 1, dy: -3, c: '#FF8C00'},
                {dx: 0, dy: -4, c: '#FF6600'},
                {dx: -4, dy: 0, c: '#FF6600'},
                {dx: 4, dy: 0, c: '#FF6600'},
                {dx: -3, dy: -2, c: '#FF6600'},
                {dx: 3, dy: -2, c: '#FF6600'},
                {dx: -2, dy: -3, c: '#FF6600'},
                {dx: 2, dy: -3, c: '#FF6600'},
                {dx: -1, dy: -4, c: '#FF6600'},
                {dx: 1, dy: -4, c: '#FF6600'},
                {dx: 0, dy: -5, c: '#FF4500'},
                {dx: -4, dy: -1, c: '#CD6600'},
                {dx: 4, dy: -1, c: '#CD6600'},
                {dx: -3, dy: -3, c: '#CD6600'},
                {dx: 3, dy: -3, c: '#CD6600'},
                {dx: -2, dy: -4, c: '#CD6600'},
                {dx: 2, dy: -4, c: '#CD6600'},
                {dx: 0, dy: -6, c: '#FF3300'},
                {dx: 0, dy: 1, c: '#8B4513'},
                {dx: -1, dy: 1, c: '#A0522D'},
                {dx: 1, dy: 1, c: '#A0522D'},
                {dx: -2, dy: 1, c: '#8B4513'},
                {dx: 2, dy: 1, c: '#8B4513'},
                {dx: 0, dy: 2, c: '#654321'},
            ];

            for (const p of flamePixels) {
                ctx.fillStyle = isEnemyAbsorb ? this.shiftToRed(p.c) : p.c;
                ctx.fillRect(
                    px + p.dx * pixelSize - pixelSize / 2,
                    py + p.dy * pixelSize - pixelSize / 2 + this.floatOffset * 0.3,
                    pixelSize,
                    pixelSize
                );
            }

            ctx.save();
            for (const pt of this.particles) {
                const pty = py + pt.oy + Math.sin(this.age / 200 * pt.speed + pt.phase) * 4;
                const ptx = px + pt.ox + Math.cos(this.age / 150 + pt.phase) * 3;
                ctx.fillStyle = isEnemyAbsorb ? '#FF6633' : '#FFD700';
                ctx.fillRect(ptx - 2, pty - 2, 3, 3);
            }
            ctx.restore();

            if (this.age > this.lifetime - 600) {
                const blink = Math.sin(this.age / 80) > 0;
                if (blink) {
                    ctx.fillStyle = isEnemyAbsorb ? 'rgba(255, 50, 0, 0.4)' : 'rgba(255, 150, 0, 0.4)';
                    ctx.beginPath();
                    ctx.arc(px, py, this.radius * 1.8, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            ctx.restore();
        }

        shiftToRed(color) {
            const map = {
                '#FFFACD': '#FFE4E1',
                '#FFF8DC': '#FFDAB9',
                '#FFE4B5': '#FFB6C1',
                '#FFD700': '#FF6347',
                '#DAA520': '#FF4500',
                '#FFA500': '#FF3300',
                '#FF8C00': '#CC2200',
                '#FF6600': '#AA1100',
                '#CD6600': '#880000',
                '#FF4500': '#660000',
            };
            return map[color] || color;
        }
    }

    class Game {
        static WIDTH = 1280;
        static HEIGHT = 720;
        static LANE_COUNT = 4;
        static BATTLEFIELD_TOP = 280;
        static BATTLEFIELD_BOTTOM = 610;
        static LANE_HEIGHT = (Game.BATTLEFIELD_BOTTOM - Game.BATTLEFIELD_TOP) / Game.LANE_COUNT;
        static SPAWN_ZONE_WIDTH = 220;
        static SPAWN_ZONE_LEFT = 0;
        static VICTORY_X = 1040;
        static GAME_TIME = 180;

        static GRID_ROWS = 4;
        static GRID_COLS = 7;
        static GRID_LEFT = 220;
        static GRID_RIGHT = 1040;
        static CELL_WIDTH = Math.floor((Game.GRID_RIGHT - Game.GRID_LEFT) / Game.GRID_COLS);

        static MUSEUM_X = 1040;
        static MUSEUM_WIDTH = 240;

        static getLaneY(lane) {
            return Game.BATTLEFIELD_TOP + Game.LANE_HEIGHT * (lane + 0.5);
        }

        static getLane(y) {
            const lane = Math.floor((y - Game.BATTLEFIELD_TOP) / Game.LANE_HEIGHT);
            return Math.max(0, Math.min(Game.LANE_COUNT - 1, lane));
        }

        static getCellCenter(col, row) {
            return {
                x: Game.GRID_LEFT + Game.CELL_WIDTH * (col + 0.5),
                y: Game.getLaneY(row)
            };
        }

        static getCellAt(x, y) {
            if (x < Game.GRID_LEFT || x >= Game.GRID_RIGHT || y < Game.BATTLEFIELD_TOP || y >= Game.BATTLEFIELD_BOTTOM) {
                return null;
            }
            const col = Math.floor((x - Game.GRID_LEFT) / Game.CELL_WIDTH);
            const row = Game.getLane(y);
            return { col: Math.max(0, Math.min(Game.GRID_COLS - 1, col)), row };
        }

        constructor() {
            this.canvas = null;
            this.ctx = null;
            this.assets = null;
            this.state = 'idle';
            this.gameTime = 0;
            this.timeLeft = Game.GAME_TIME;
            this.spirits = [];
            this.enemies = [];
            this.bullets = [];
            this.floatTexts = [];
            this.lingyun = 3;
            this.orbs = [];
            this.selectedCard = null;
            this.lastTime = 0;
            this.mouseX = 0;
            this.mouseY = 0;
            this.mouseInCanvas = false;
            this.orbWaveTimer = 0;
            this.nextOrbWaveTime = 3000 + Math.random() * 2000;
            this.waveIndex = 0;
            this.previewSprite = null;
            this.restartBtn = null;
            this.isRunning = false;

            this.enemyLingyun = 0;
            this.enemyQueue = [];
            this.enemyPreviewSprites = {};
            this.tutorialMode = false;

            this.stars = [];
            this.fogParticles = [];
        }

        init(assets) {
            this.assets = assets;
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.restartBtn = document.getElementById('restart-btn');
            window.game = this;
            this.generateStars();
            this.generateFogParticles();
            this.bindEvents();
            this.initEnemyPreviews();
        }

        generateStars() {
            this.stars = [];
            const rng = this._seededRandom(42);
            for (let i = 0; i < 100; i++) {
                this.stars.push({
                    x: Math.floor(rng() * Game.WIDTH),
                    y: Math.floor(rng() * 90),
                    size: i < 80 ? 1 : 2,
                    bright: 0.5 + rng() * 0.5,
                    phase: rng() * Math.PI * 2,
                    speed: 0.5 + rng() * 1.5
                });
            }
        }

        generateFogParticles() {
            this.fogParticles = [];
            const rng = this._seededRandom(123);
            for (let i = 0; i < 15; i++) {
                this.fogParticles.push({
                    x: rng() * Game.SPAWN_ZONE_WIDTH,
                    y: Game.BATTLEFIELD_TOP + rng() * (Game.BATTLEFIELD_BOTTOM - Game.BATTLEFIELD_TOP),
                    size: 20 + Math.floor(rng() * 40),
                    speed: 0.1 + rng() * 0.3,
                    alpha: 0.08 + rng() * 0.12,
                    phase: rng() * Math.PI * 2
                });
            }
        }

        initEnemyPreviews() {
            const bar = document.getElementById('enemy-queue-bar');
            if (!bar) return;

            for (const key in this.assets.enemies) {
                const enemyData = this.assets.enemies[key];
                if (!enemyData || !enemyData.idle) continue;

                const div = document.createElement('div');
                div.className = 'enemy-preview';
                div.dataset.enemyType = key;
                div.style.display = 'none';

                const canvas = document.createElement('canvas');
                canvas.width = 32;
                canvas.height = 32;
                div.appendChild(canvas);

                bar.appendChild(div);

                const sprite = new window.Sprite({
                    idle: enemyData.idle,
                    attack: enemyData.attack
                });
                sprite.play('idle');
                this.enemyPreviewSprites[key] = { sprite, canvas, ctx: canvas.getContext('2d'), div };
            }
        }

        reset() {
            this.gameTime = 0;
            this.timeLeft = Game.GAME_TIME;
            this.spirits = [];
            this.enemies = [];
            this.bullets = [];
            this.floatTexts = [];
            this.lingyun = 3;
            this.orbs = [];
            this.selectedCard = null;
            this.lastTime = 0;
            this.orbWaveTimer = 0;
            this.nextOrbWaveTime = 3000 + Math.random() * 2000;
            this.waveIndex = 0;
            this.previewSprite = null;

            this.enemyLingyun = 0;
            this.enemyQueue = [];
            this.tutorialMode = false;

            this.spawnInitialEnemies();
            this.updateUI();

            if (this.restartBtn) {
                this.restartBtn.style.display = 'none';
            }

            document.querySelectorAll('.card-slot').forEach(s => {
                s.classList.remove('selected', 'disabled');
                s.style.borderColor = '';
            });
        }

        spawnInitialEnemies() {
            // 最后一列固定 4 个刀兵
            for (let row = 0; row < Game.GRID_ROWS; row++) {
                this.addEnemy('enemy_knife', Game.GRID_COLS - 1, row, true);
            }

            // 其他列随机生成 2-4 个敌人
            const count = 2 + Math.floor(Math.random() * 3);
            const occupied = new Set();
            for (let row = 0; row < Game.GRID_ROWS; row++) {
                occupied.add((Game.GRID_COLS - 1) + ',' + row);
            }
            for (let i = 0; i < count; i++) {
                let col, row, attempts = 0;
                do {
                    col = 3 + Math.floor(Math.random() * 3);
                    row = Math.floor(Math.random() * Game.GRID_ROWS);
                    attempts++;
                } while (attempts < 30 && occupied.has(col + ',' + row));
                if (attempts < 30) {
                    occupied.add(col + ',' + row);
                    const type = Math.random() < 0.5 ? 'enemy_gun' : 'enemy_knife';
                    this.addEnemy(type, col, row, true);
                }
            }
        }

        chooseEnemyLane() {
            const laneCounts = [0, 0, 0, 0];
            for (const s of this.spirits) {
                if (s.dead) continue;
                const lane = Game.getLane(s.y);
                laneCounts[lane]++;
            }

            let maxCount = -1;
            const maxLanes = [];
            for (let i = 0; i < laneCounts.length; i++) {
                if (laneCounts[i] > maxCount) {
                    maxCount = laneCounts[i];
                    maxLanes.length = 0;
                    maxLanes.push(i);
                } else if (laneCounts[i] === maxCount) {
                    maxLanes.push(i);
                }
            }

            if (maxCount === 0) {
                return Math.floor(Math.random() * Game.GRID_ROWS);
            }

            const targetLane = maxLanes[Math.floor(Math.random() * maxLanes.length)];

            if (Math.random() < 0.8) {
                return targetLane;
            } else {
                const otherLanes = [];
                for (let i = 0; i < Game.GRID_ROWS; i++) {
                    if (i !== targetLane) {
                        otherLanes.push(i);
                    }
                }
                return otherLanes[Math.floor(Math.random() * otherLanes.length)];
            }
        }

        _seededRandom(seed) {
            let s = seed;
            return function() {
                s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
                return ((s >>> 0) % 10000) / 10000;
            };
        }

        buildPlazaCanvas() {
        }

        bindEvents() {
            this.canvas.addEventListener('mousemove', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                const world = this.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
                this.mouseX = world.x;
                this.mouseY = world.y;
                this.mouseInCanvas = true;
            });

            this.canvas.addEventListener('mouseleave', () => {
                this.mouseInCanvas = false;
            });

            this.canvas.addEventListener('click', (e) => {
                if (this.state !== 'playing') return;
                const rect = this.canvas.getBoundingClientRect();
                const world = this.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
                this.handleCanvasClick(world.x, world.y);
            });

            this.canvas.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.selectedCard = null;
                document.querySelectorAll('.card-slot').forEach(s => {
                    s.classList.remove('selected');
                    s.style.borderColor = '';
                });
            });

            this.canvas.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                const rect = this.canvas.getBoundingClientRect();
                const world = this.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
                this.mouseX = world.x;
                this.mouseY = world.y;
                this.mouseInCanvas = true;
            });

            this.canvas.addEventListener('dragleave', () => {
                this.mouseInCanvas = false;
            });

            this.canvas.addEventListener('drop', (e) => {
                e.preventDefault();
                const spiritType = e.dataTransfer.getData('text/plain');
                if (!spiritType) return;
                const rect = this.canvas.getBoundingClientRect();
                const world = this.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
                this.tryPlaceSpirit(spiritType, world.x, world.y);
                this.mouseInCanvas = false;
            });
        }

        handleCanvasClick(x, y) {
            for (let i = this.orbs.length - 1; i >= 0; i--) {
                const orb = this.orbs[i];
                if (!orb.collected && !orb.absorbed && orb.containsPoint(x, y)) {
                    const gain = orb.collect();
                    this.lingyun += gain;
                    this.floatTexts.push(new FloatText(orb.x, orb.y, '+1', '#ffd700'));
                    this.updateUI();
                    return;
                }
            }
        }

        tryPlaceSpirit(spiritType, x, y) {
            if (!this.isInSpawnZone(x)) return false;

            const lane = Game.getLane(y);
            const spiritData = this.assets.spirits[spiritType];
            if (!spiritData) return false;

            const HUYING_ULTIMATE_COST = 23;
            const isUltimate = spiritType === 'huying' && this.lingyun >= HUYING_ULTIMATE_COST;
            const actualCost = isUltimate ? HUYING_ULTIMATE_COST : spiritData.stats.cost;

            if (this.lingyun < actualCost) return false;

            const placeX = Math.max(Game.SPAWN_ZONE_LEFT + 50, Math.min(Game.SPAWN_ZONE_WIDTH - 20, x));
            const placeY = Game.getLaneY(lane);

            const hasOverlap = this.spirits.some(s => {
                if (s.dead) return false;
                const sLane = Game.getLane(s.y);
                return sLane === lane && Math.abs(s.x - placeX) < 70;
            });

            if (hasOverlap) return false;

            const spirit = this.addSpirit(spiritType, placeX, placeY);
            if (isUltimate && spirit) {
                spirit.initHuyingUltimate(lane);
            }
            this.lingyun -= actualCost;
            this.selectedCard = null;
            document.querySelectorAll('.card-slot').forEach(s => {
                s.classList.remove('selected');
                s.style.borderColor = '';
            });
            this.updateUI();
            return true;
        }

        startBattle() {
            if (this.isRunning) return;
            this.reset();
            this.state = 'playing';
            this.isRunning = true;
            this.lastTime = performance.now();
            requestAnimationFrame(this.loop.bind(this));
        }

        stopBattle() {
            this.isRunning = false;
            if (this.ctx) {
                this.ctx.clearRect(0, 0, Game.WIDTH, Game.HEIGHT);
            }
        }

        loop(timestamp) {
            if (!this.isRunning) return;

            let dt = timestamp - this.lastTime;
            this.lastTime = timestamp;

            if (dt > 100) dt = 100;

            if (this.state === 'playing') {
                this.update(dt);
            }

            this.render();
            requestAnimationFrame(this.loop.bind(this));
        }

        update(dt) {
            const dtSeconds = dt / 1000;

            this.gameTime += dtSeconds;
            if (!this.tutorialMode) {
                this.timeLeft = Math.max(0, this.timeLeft - dtSeconds);
            }

            this.orbWaveTimer += dt;
            if (this.orbWaveTimer >= this.nextOrbWaveTime) {
                this.orbWaveTimer = 0;
                this.nextOrbWaveTime = 3000 + Math.random() * 2000;
                this.spawnOrbWave();
            }

            while (this.waveIndex < WAVES.length && this.gameTime >= WAVES[this.waveIndex].triggerTime) {
                this.spawnWave(this.waveIndex);
                this.waveIndex++;
            }

            this.trySummonEnemy();

            for (let i = this.enemyQueue.length - 1; i >= 0; i--) {
                this.enemyQueue[i].delay -= dt;
                if (this.enemyQueue[i].delay <= 0) {
                    const eq = this.enemyQueue[i];
                    this.addEnemy(eq.type, eq.col, eq.row, true);
                    this.enemyQueue.splice(i, 1);
                }
            }

            for (const spirit of this.spirits) {
                spirit.update(dt, this);
            }

            for (const enemy of this.enemies) {
                enemy.update(dt, this);
            }

            for (const bullet of this.bullets) {
                bullet.update(dt, this);
            }
            this.bullets = this.bullets.filter(b => !b.dead);

            for (const ft of this.floatTexts) {
                ft.update(dt);
            }
            this.floatTexts = this.floatTexts.filter(f => !f.dead);

            this.updateOrbs(dt);

            this.spirits = this.spirits.filter(s => !s.dead || s.fadeAlpha > 0);
            this.enemies = this.enemies.filter(e => !e.dead || e.fadeAlpha > 0);

            this.checkVictory();
            this.updateEnemyPreviewUI();
        }

        onZengboAbsorb(spirit) {
            if (!spirit) return;
            this.lingyun += 1;
            this.floatTexts.push(new FloatText(spirit.x, spirit.y - 50, '+1', '#ffd700'));

            if (!spirit.dead) {
                spirit.zengboAbsorbCount += 1;
                if (spirit.zengboAbsorbCount >= 3) {
                    spirit.willDisappear = true;
                    spirit.hp = 0;
                    spirit.dead = true;
                    spirit.deathTimer = 0;
                    this.floatTexts.push(new FloatText(spirit.x, spirit.y - 80, '灵韵归乡', '#ffd700'));
                }
            }
            this.updateUI();
        }

        trySummonEnemy() {
            const COST = 12;
            if (this.enemyLingyun < COST) return;

            const typeToSummon = Math.random() < 0.5 ? 'enemy_knife' : 'enemy_gun';
            const targetRow = this.chooseEnemyLane();
            const candidates = [];
            for (let c = 2; c <= 6; c++) {
                if (!this.isCellOccupied(c, targetRow)) {
                    candidates.push(c);
                }
            }
            if (candidates.length > 0) {
                this.enemyLingyun -= COST;
                const col = candidates[Math.floor(Math.random() * candidates.length)];
                this.enemyQueue.push({ type: typeToSummon, col: col, row: targetRow, delay: 1500 });
                this.updateUI();
            }
        }

        spawnOrbWave() {
            const count = 3 + Math.floor(Math.random() * 4);
            const positions = [];
            const newOrbs = [];
            for (let i = 0; i < count; i++) {
                let x, y, attempts = 0;
                do {
                    x = Game.SPAWN_ZONE_WIDTH + 100 + Math.random() * (Game.VICTORY_X - Game.SPAWN_ZONE_WIDTH - 250);
                    y = Game.BATTLEFIELD_TOP + 70 + Math.random() * (Game.BATTLEFIELD_BOTTOM - Game.BATTLEFIELD_TOP - 140);
                    attempts++;
                } while (attempts < 20 && positions.some(p => Math.abs(p.x - x) < 90 && Math.abs(p.y - y) < 90));
                positions.push({x, y});
                const orb = new Orb(x, y);
                this.orbs.push(orb);
                newOrbs.push(orb);
            }

            // 曾伯自动抢夺：每波每个存活且未抢够3个的曾伯抢1个
            const zengbos = this.spirits
                .filter(s => !s.dead && !s.isEnemy && s.type === 'zengbo' && s.zengboAbsorbCount < 3)
                .sort((a, b) => a.x - b.x);
            for (const zengbo of zengbos) {
                const orb = newOrbs.find(o => !o.absorbed && !o.collected);
                if (orb) {
                    orb.setZengboAbsorb(zengbo);
                }
            }
        }

        spawnWave(waveIdx) {
            const wave = WAVES[waveIdx];
            for (const e of wave.enemies) {
                this.addEnemy(e.type, e.col, e.row, true);
            }
        }

        updateOrbs(dt) {
            for (let i = this.orbs.length - 1; i >= 0; i--) {
                const orb = this.orbs[i];
                orb.update(dt);

                if (orb.absorbed && !orb._absorbedGiven) {
                    orb._absorbedGiven = true;
                    if (!orb.byPlayer) {
                        const gain = orb.absorbByEnemy();
                        if (!this.tutorialMode) {
                            this.enemyLingyun += gain;
                        }
                        this.floatTexts.push(new FloatText(orb.x, orb.y, '-1', '#ff4444'));
                        this.updateUI();
                    }
                }

                if (orb.collected) {
                    this.orbs.splice(i, 1);
                }
            }
        }

        checkVictory() {
            const spiritReached = this.spirits.some(s => s.x >= Game.VICTORY_X && !s.dead && !s.isHuyingUltimate);
            if (spiritReached) {
                this.isRunning = false;
                if (window.sceneManager) {
                    window.sceneManager.setState('ending');
                }
                return;
            }

            if (!this.tutorialMode && this.timeLeft <= 0) {
                this.state = 'lose';
                this.isRunning = false;
                if (this.restartBtn) this.restartBtn.style.display = 'block';
            }
        }

        render() {
            if (this.state !== 'playing' && this.state !== 'lose') {
                return;
            }

            const ctx = this.ctx;
            ctx.imageSmoothingEnabled = false;

            ctx.clearRect(0, 0, Game.WIDTH, Game.HEIGHT);

            if (this.assets && this.assets.background) {
                ctx.drawImage(this.assets.background, 0, 0);
            }

            const warmOverlay = ctx.createLinearGradient(0, 0, Game.WIDTH, 0);
            warmOverlay.addColorStop(0, 'rgba(20,25,35,0.15)');
            warmOverlay.addColorStop(0.5, 'rgba(120,90,50,0.05)');
            warmOverlay.addColorStop(1, 'rgba(200,140,60,0.1)');
            ctx.fillStyle = warmOverlay;
            ctx.fillRect(0, 0, Game.WIDTH, Game.HEIGHT);

            this.renderSky(ctx);

            this.renderMuseumGlow(ctx);

            this.renderGroundMarkings(ctx);

            const aliveUnits = [];
            const deadUnits = [];
            for (const unit of [...this.spirits, ...this.enemies]) {
                if (unit.dead) {
                    deadUnits.push(unit);
                } else {
                    aliveUnits.push(unit);
                }
            }
            aliveUnits.sort((a, b) => a.y - b.y);
            deadUnits.sort((a, b) => a.y - b.y);
            const allUnits = [...deadUnits, ...aliveUnits];

            for (const unit of allUnits) {
                this.renderUnitShadow(ctx, unit);
            }

            for (const unit of allUnits) {
                unit.render(ctx, this);
                if (!unit.dead) {
                    this.renderHealthBar(ctx, unit);
                }
            }

            for (const bullet of this.bullets) {
                bullet.render(ctx);
            }

            this.renderOrbs(ctx);
            this.renderFloatTexts(ctx);
            this.renderPlacementPreview(ctx);
            this.renderAmbientFog(ctx);
            this.renderGameOverUI(ctx);
        }

        renderFloatTexts(ctx) {
            for (const ft of this.floatTexts) {
                ft.render(ctx);
            }
        }

        renderSky(ctx) {
            const time = this.gameTime * 1000;
            for (const star of this.stars) {
                const flicker = Math.sin(time / 800 * star.speed + star.phase) * 0.35 + 0.65;
                const brightness = flicker * (star.bright || 0.8) * 0.6;
                ctx.fillStyle = `rgba(255,255,${230 + Math.floor(flicker * 20)},${brightness})`;
                ctx.fillRect(star.x, star.y, star.size, star.size);
                if (star.size >= 2) {
                    ctx.fillStyle = `rgba(255,255,240,${brightness * 0.3})`;
                    ctx.fillRect(star.x - 1, star.y, star.size + 2, 1);
                    ctx.fillRect(star.x, star.y - 1, 1, star.size + 2);
                }
            }
        }

        renderMuseumGlow(ctx) {
            const time = this.gameTime * 1000;
            const glowPulse = Math.sin(time / 700) * 0.1 + 0.2;
            const entranceX = 1130;
            const entranceY = 340;

            const entranceGlow = ctx.createRadialGradient(
                entranceX, entranceY, 5,
                entranceX, entranceY, 90
            );
            entranceGlow.addColorStop(0, `rgba(255,220,100,${glowPulse})`);
            entranceGlow.addColorStop(0.4, `rgba(255,180,60,${glowPulse * 0.4})`);
            entranceGlow.addColorStop(1, 'rgba(255,120,30,0)');
            ctx.fillStyle = entranceGlow;
            ctx.fillRect(entranceX - 100, entranceY - 100, 200, 200);

            const goalGrad = ctx.createLinearGradient(1020, 0, 1060, 0);
            goalGrad.addColorStop(0, 'rgba(255,200,80,0)');
            goalGrad.addColorStop(0.5, 'rgba(255,180,60,0.12)');
            goalGrad.addColorStop(1, 'rgba(255,160,50,0)');
            ctx.fillStyle = goalGrad;
            ctx.fillRect(1020, Game.BATTLEFIELD_TOP, 40, Game.BATTLEFIELD_BOTTOM - Game.BATTLEFIELD_TOP);

            const groundGlow = ctx.createRadialGradient(
                entranceX, entranceY + 100, 10,
                entranceX, entranceY + 200, 200
            );
            groundGlow.addColorStop(0, 'rgba(255,180,80,0.15)');
            groundGlow.addColorStop(0.5, 'rgba(255,150,60,0.08)');
            groundGlow.addColorStop(1, 'rgba(255,120,40,0)');
            ctx.fillStyle = groundGlow;
            ctx.fillRect(1000, 400, 200, 200);
        }

        renderGroundMarkings(ctx) {
            const occupiedCells = new Set();
            for (const e of this.enemies) {
                if (e.dead) continue;
                const c = Game.getCellAt(e.x, e.y);
                if (c) occupiedCells.add(c.col + ',' + c.row);
            }

            for (let row = 0; row < Game.GRID_ROWS; row++) {
                for (let col = 0; col < Game.GRID_COLS; col++) {
                    const cx = Game.GRID_LEFT + col * Game.CELL_WIDTH;
                    const cy = Game.BATTLEFIELD_TOP + row * Game.LANE_HEIGHT;
                    const key = col + ',' + row;
                    if (occupiedCells.has(key)) {
                        ctx.fillStyle = 'rgba(0,0,0,0.2)';
                        ctx.beginPath();
                        ctx.ellipse(
                            Math.round(cx + Game.CELL_WIDTH / 2),
                            Math.round(cy + Game.LANE_HEIGHT - 8),
                            28, 10, 0, 0, Math.PI * 2
                        );
                        ctx.fill();
                    }
                }
            }
        }

        renderUnitShadow(ctx, unit) {
            if (unit.dead) return;
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.ellipse(unit.x, unit.y + 35, 22, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        renderAmbientFog(ctx) {
            const time = this.gameTime * 1000;
            for (const fp of this.fogParticles) {
                const drift = Math.sin(time / 2500 * fp.speed + fp.phase) * 20;
                const px = fp.x + drift;
                if (px > Game.SPAWN_ZONE_WIDTH + 40) continue;
                const py = fp.y + Math.sin(time / 3500 + fp.phase) * 10;
                const grad = ctx.createRadialGradient(px, py, 0, px, py, fp.size);
                grad.addColorStop(0, `rgba(60,55,50,${fp.alpha * 0.5})`);
                grad.addColorStop(0.5, `rgba(50,45,42,${fp.alpha * 0.2})`);
                grad.addColorStop(1, 'rgba(40,35,32,0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(px, py, fp.size, 0, Math.PI * 2);
                ctx.fill();
            }

            const edgeGrad1 = ctx.createLinearGradient(0, 0, 260, 0);
            edgeGrad1.addColorStop(0, 'rgba(20,18,15,0.6)');
            edgeGrad1.addColorStop(0.6, 'rgba(25,22,20,0.25)');
            edgeGrad1.addColorStop(1, 'rgba(30,25,22,0)');
            ctx.fillStyle = edgeGrad1;
            ctx.fillRect(0, Game.BATTLEFIELD_TOP, 260, Game.BATTLEFIELD_BOTTOM - Game.BATTLEFIELD_TOP);

            const topGrad = ctx.createLinearGradient(0, 0, 0, 80);
            topGrad.addColorStop(0, 'rgba(0,0,0,0.6)');
            topGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = topGrad;
            ctx.fillRect(0, 0, Game.WIDTH, 80);

            const bottomGrad = ctx.createLinearGradient(0, Game.HEIGHT - 80, 0, Game.HEIGHT);
            bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
            bottomGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
            ctx.fillStyle = bottomGrad;
            ctx.fillRect(0, Game.HEIGHT - 80, Game.WIDTH, 80);
        }

        renderHealthBar(ctx, unit) {
            if (unit.dead) return;
            const barWidth = 44;
            const barHeight = 5;
            const scale = unit.scale || 1;
            const x = unit.x - barWidth / 2;
            const y = unit.y - 80 * scale - 8;
            const hpPercent = unit.hp / unit.maxHp;

            ctx.fillStyle = 'rgba(40, 40, 40, 0.8)';
            ctx.fillRect(x, y, barWidth, barHeight);

            ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, barWidth, barHeight);

            let hpColor;
            if (hpPercent > 0.6) {
                hpColor = '#22cc22';
            } else if (hpPercent > 0.3) {
                hpColor = '#cccc22';
            } else {
                hpColor = '#cc2222';
            }
            ctx.fillStyle = hpColor;
            ctx.fillRect(x + 1, y + 1, (barWidth - 2) * hpPercent, barHeight - 2);

            // 护盾条（蓝白色，显示在血条上方）
            if (unit.shield > 0) {
                const shieldY = y - 4;
                ctx.fillStyle = 'rgba(40, 40, 60, 0.8)';
                ctx.fillRect(x, shieldY, barWidth, 3);
                ctx.fillStyle = '#88ccff';
                ctx.fillRect(x + 1, shieldY + 1, (barWidth - 2) * (unit.shield / 3), 1);
            }

            if (unit.slowTimer > 0) {
                ctx.fillStyle = 'rgba(100, 150, 255, 0.5)';
                ctx.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4);
            }
        }

        renderOrbs(ctx) {
            for (const orb of this.orbs) {
                orb.render(ctx);
            }
        }

        renderPlacementPreview(ctx) {
            if (!this.selectedCard || !this.mouseInCanvas) return;

            const canPlace = this.isInSpawnZone(this.mouseX);
            const lane = Game.getLane(this.mouseY);
            const previewY = Game.getLaneY(lane);
            const spiritData = this.assets.spirits[this.selectedCard];
            const canAfford = spiritData && this.lingyun >= spiritData.stats.cost;

            const hasOverlap = this.spirits.some(s => {
                if (s.dead) return false;
                const sLane = Game.getLane(s.y);
                return sLane === lane && Math.abs(s.x - this.mouseX) < 50;
            });

            ctx.save();

            if (canPlace && canAfford && !hasOverlap) {
                ctx.strokeStyle = 'rgba(100,220,150,0.5)';
                ctx.fillStyle = 'rgba(100,220,150,0.12)';
            } else {
                ctx.strokeStyle = 'rgba(220,80,80,0.5)';
                ctx.fillStyle = 'rgba(220,80,80,0.1)';
            }

            ctx.lineWidth = 2;
            const zoneWidth = Game.SPAWN_ZONE_WIDTH - Game.SPAWN_ZONE_LEFT;
            ctx.fillRect(Game.SPAWN_ZONE_LEFT, Game.BATTLEFIELD_TOP, zoneWidth, Game.BATTLEFIELD_BOTTOM - Game.BATTLEFIELD_TOP);
            ctx.strokeRect(Game.SPAWN_ZONE_LEFT, Game.BATTLEFIELD_TOP, zoneWidth, Game.BATTLEFIELD_BOTTOM - Game.BATTLEFIELD_TOP);

            if (spiritData && spiritData.idle) {
                if (!this.previewSprite || this.previewSprite._type !== this.selectedCard) {
                    this.previewSprite = new window.Sprite({
                        idle: spiritData.idle,
                        walk: spiritData.walk,
                        attack: spiritData.attack
                    });
                    this.previewSprite._type = this.selectedCard;
                    this.previewSprite.play('idle');
                }
                ctx.globalAlpha = 0.5;
                const previewX = Math.max(Game.SPAWN_ZONE_LEFT + 50, Math.min(Game.SPAWN_ZONE_WIDTH - 20, this.mouseX));
                this.previewSprite.draw(ctx, previewX, previewY, spiritData.stats.flipX, 0.7, 1.8);
            }

            ctx.restore();
        }

        renderGameOverUI(ctx) {
            if (this.state === 'lose') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, 0, Game.WIDTH, Game.HEIGHT);

                ctx.font = 'bold 56px "Microsoft YaHei", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                ctx.fillStyle = '#ff4444';
                ctx.fillText('⏰ 时间耗尽，任务失败', Game.WIDTH / 2, Game.HEIGHT / 2 - 40);
            }
        }

        addSpirit(type, x, y) {
            const spiritData = this.assets.spirits[type];
            if (!spiritData) return;

            const spirit = new SpiritUnit(type, spiritData, x, y, false, this);
            spirit.fadeInAlpha = 0;
            this.spirits.push(spirit);
            return spirit;
        }

        addEnemy(type, colOrX, rowOrLane, isCell) {
            const enemyData = this.assets.enemies[type];
            if (!enemyData) return;

            let x, y;
            if (isCell) {
                if (this.isCellOccupied(colOrX, rowOrLane)) return null;
                const center = Game.getCellCenter(colOrX, rowOrLane);
                x = center.x;
                y = center.y;
            } else {
                x = colOrX;
                y = Game.getLaneY(rowOrLane);
            }
            const enemy = new SpiritUnit(type, enemyData, x, y, true, this);
            enemy.fadeInAlpha = 0;
            this.enemies.push(enemy);
            return enemy;
        }

        screenToWorld(screenX, screenY) {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = rect.width / Game.WIDTH;
            const scaleY = rect.height / Game.HEIGHT;
            return {
                x: screenX / scaleX,
                y: screenY / scaleY
            };
        }

        isInSpawnZone(x) {
            return x >= Game.SPAWN_ZONE_LEFT && x < Game.SPAWN_ZONE_WIDTH;
        }

        isCellOccupied(col, row) {
            for (const e of this.enemies) {
                if (e.dead) continue;
                const cell = Game.getCellAt(e.x, e.y);
                if (cell && cell.col === col && cell.row === row) return true;
            }
            return false;
        }

        updateCardStates() {
            const slots = document.querySelectorAll('.card-slot');
            slots.forEach(slot => {
                const spiritType = slot.dataset.spirit;
                if (!spiritType) return;
                const spiritData = this.assets.spirits[spiritType];
                if (!spiritData) return;

                if (this.lingyun < spiritData.stats.cost) {
                    slot.classList.add('disabled');
                } else {
                    slot.classList.remove('disabled');
                }
            });
        }

        updateEnemyPreviewUI() {
            const upcoming = [];

            for (let i = this.waveIndex; i < WAVES.length; i++) {
                const wave = WAVES[i];
                if (wave.triggerTime <= this.gameTime + 10) {
                    for (const e of wave.enemies) {
                        upcoming.push(e.type);
                    }
                }
            }

            for (const eq of this.enemyQueue) {
                upcoming.push(eq.type);
            }

            const previewCount = Math.min(5, upcoming.length);
            let idx = 0;

            for (const key in this.enemyPreviewSprites) {
                const preview = this.enemyPreviewSprites[key];
                preview.div.style.display = 'none';
            }

            const shownTypes = {};
            for (const type of upcoming) {
                if (idx >= previewCount) break;
                const preview = this.enemyPreviewSprites[type];
                if (!preview) continue;

                if (!shownTypes[type]) {
                    shownTypes[type] = true;
                    preview.div.style.display = 'flex';
                    preview.sprite.update(16);
                    preview.ctx.clearRect(0, 0, 32, 32);
                    preview.ctx.imageSmoothingEnabled = false;
                    preview.sprite.draw(preview.ctx, 16, 30, true, 1, 0.4);
                    idx++;
                }
            }
        }

        updateUI() {
            const timerEl = document.getElementById('timer');
            const lingyunEl = document.getElementById('lingyun-display');
            const enemyLingyunEl = document.getElementById('enemy-lingyun-display');

            if (timerEl) {
                const minutes = Math.floor(this.timeLeft / 60);
                const seconds = Math.floor(this.timeLeft % 60);
                timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }

            if (lingyunEl) {
                lingyunEl.textContent = `${Math.floor(this.lingyun)}`;
            }

            if (enemyLingyunEl) {
                enemyLingyunEl.textContent = `敌方灵韵: ${Math.floor(this.enemyLingyun)}`;
            }

            this.updateCardStates();
        }
    }

    class SpiritUnit {
        constructor(type, data, x, y, isEnemy, game) {
            this.type = type;
            this.data = data;
            this.x = x;
            this.y = y;
            this.isEnemy = isEnemy;
            this.hp = data.stats.hp;
            this.maxHp = data.stats.hp;
            this.attack = data.stats.attack;
            this.defense = data.stats.defense || 0;
            this.speed = data.stats.speed || 0;
            this.unitType = data.stats.type || 'normal';
            this.shield = 0;
            this.maxShield = 0;
            this.zengboAbsorbCount = 0;
            this.willDisappear = false;
            this.dead = false;
            this.state = 'idle';
            this.attackCooldown = 0;
            this.currentTarget = null;
            this.fadeAlpha = 1;
            this.fadeInAlpha = 1;
            this.deathTimer = 0;
            this.scale = 1.8;
            this.flipX = data.stats.flipX || false;

            this.slowTimer = 0;
            this.slowFactor = 1;

            // 虎鎣刺客模式状态
            this.isHuyingAssassin = false;
            this.huyingState = 'none';
            this.huyingTarget = null;
            this.dashStartX = 0;
            this.dashEndX = 0;
            this.dashTimer = 0;
            this.dashDuration = 150;
            this.dashGhostTrail = [];

            // 虎鎣必杀模式状态
            this.isHuyingUltimate = false;
            this.ultimateState = 'none';
            this.ultimateSpeed = 1600;
            this.ultimateFadeTimer = 0;
            this.ultimateFadeDuration = 300;

            const isRanged = data.stats.attack_type === 'ranged';
            this.isRanged = isRanged;
            if (isRanged) {
                this.range = data.stats.range || 400;
                this.attackCooldownMax = 1800;
            } else {
                this.range = data.stats.range || 120;
                this.attackCooldownMax = 1500;
            }

            this.sprite = new window.Sprite({
                idle: data.idle,
                walk: data.walk || data.idle,
                attack: data.attack
            });
            this.sprite.play('idle');

            const self = this;
            this.sprite.onHitFrame = function() {
                self.performAttack();
            };

            // 虎鎣放置后立即进入刺客模式
            if (type === 'huying' && !isEnemy && game) {
                this.initHuyingAssassin(game);
            }
        }

        initHuyingAssassin(game) {
            const { target } = this.findTarget(game);
            if (target) {
                this.isHuyingAssassin = true;
                this.huyingTarget = target;
                this.huyingState = 'fading_in';
                this.dashStartX = this.x;
                this.dashEndX = target.x - 80;
                this.dashTimer = 0;
                this.dashGhostTrail = [];
            } else {
                this.dead = true;
                this.deathTimer = 0;
                this.fadeAlpha = 1;
            }
        }

        initHuyingUltimate(lane) {
            this.isHuyingUltimate = true;
            this.ultimateState = 'dashing';
            this.x = -80;
            this.y = Game.getLaneY(lane);
            this.dashGhostTrail = [];
            this.fadeInAlpha = 1;
            this.fadeAlpha = 1;
            this.flipX = false;
            if (window.GameAudio) {
                window.GameAudio.playSfx('ultimateDash');
            }
        }

        performAttack() {
            if (!this.currentTarget || this.currentTarget.dead) return;
            if (this.isRanged) {
                const bullet = new Bullet(
                    this.x,
                    this.y - 40,
                    this.currentTarget.x,
                    this.currentTarget.y - 40,
                    this.attack,
                    this.isEnemy,
                    true,
                    this.unitType,
                    this.currentTarget
                );
                if (window.game) window.game.bullets.push(bullet);
            } else {
                const baseDmg = Math.max(1, Math.floor(this.attack * (100 / (100 + this.currentTarget.defense * 5))));
                const counter = getCounterMultiplier(this.unitType, this.currentTarget.unitType);
                const dmg = Math.max(1, Math.floor(baseDmg * counter));
                this.currentTarget.takeDamage(dmg);

                if (this.isEnemy && !this.currentTarget.isEnemy) {
                    this.currentTarget.applySlow(0.5, 1500);
                }

                if (this.isHuyingAssassin) {
                    this.dead = true;
                    this.deathTimer = 0;
                    if (window.game) {
                        window.game.floatTexts.push(new FloatText(this.x, this.y - 60, '同归于尽', '#ff6600'));
                    }
                }
            }
        }

        applySlow(factor, duration) {
            this.slowFactor = Math.min(this.slowFactor, factor);
            this.slowTimer = Math.max(this.slowTimer, duration);
        }

        findTarget(game) {
            const opponents = this.isEnemy ? game.spirits : game.enemies;
            let target = null;
            let minDist = Infinity;
            for (const opp of opponents) {
                if (opp.dead) continue;
                const myLane = Game.getLane(this.y);
                const oppLane = Game.getLane(opp.y);
                if (myLane !== oppLane) continue;

                let inFront;
                if (this.isEnemy) {
                    inFront = opp.x < this.x;
                } else {
                    inFront = opp.x > this.x;
                }
                if (inFront) {
                    const dist = Math.abs(opp.x - this.x);
                    if (dist < minDist) {
                        minDist = dist;
                        target = opp;
                    }
                }
            }
            return { target, minDist };
        }

        update(dt, game) {
            if (this.fadeInAlpha < 1) {
                this.fadeInAlpha = Math.min(1, this.fadeInAlpha + dt / 300);
            }

            if (this.dead) {
                this.deathTimer += dt;
                this.fadeAlpha = Math.max(0, 1 - this.deathTimer / 500);
                this.sprite.update(dt);
                return;
            }

            if (this.isHuyingUltimate) {
                const handled = this.handleHuyingUltimate(dt, game);
                this.sprite.update(dt);
                if (handled) return;
            }

            if (this.isHuyingAssassin) {
                const handled = this.handleHuyingAssassin(dt, game);
                this.sprite.update(dt);
                if (handled) return;
            }

            if (this.slowTimer > 0) {
                this.slowTimer -= dt;
                if (this.slowTimer <= 0) {
                    this.slowFactor = 1;
                }
            }

            if (this.attackCooldown > 0) {
                this.attackCooldown -= dt;
            }

            const { target, minDist } = this.findTarget(game);
            this.currentTarget = target;
            const inRange = target && minDist <= this.range;
            const isAttackAnimPlaying = this.sprite.isAttacking();

            if (inRange) {
                if (!isAttackAnimPlaying) {
                    if (this.attackCooldown <= 0) {
                        this.state = 'attack';
                        this.sprite.play('attack');
                        this.attackCooldown = this.attackCooldownMax;
                    } else {
                        if (this.state !== 'idle') {
                            this.state = 'idle';
                            this.sprite.play('idle');
                        }
                    }
                }
            } else {
                if (this.isEnemy || this.speed <= 0) {
                    if (this.state !== 'idle') {
                        this.state = 'idle';
                        this.sprite.play('idle');
                    }
                } else {
                    if (!isAttackAnimPlaying) {
                        if (this.state !== 'walk') {
                            this.state = 'walk';
                            this.sprite.play('walk');
                        }
                        const dtSeconds = dt / 1000;
                        const effectiveSpeed = this.speed * this.slowFactor;
                        this.x += effectiveSpeed * dtSeconds;
                    }
                }
            }

            this.sprite.update(dt);
        }

        handleHuyingAssassin(dt, game) {
            if (this.huyingState === 'fading_in') {
                if (this.fadeInAlpha >= 1) {
                    this.huyingState = 'dashing';
                    this.dashTimer = 0;
                    this.sprite.play('walk');
                }
                return true;
            }

            if (this.huyingState === 'dashing') {
                this.dashTimer += dt;
                const t = Math.min(1, this.dashTimer / this.dashDuration);
                const ease = 1 - Math.pow(1 - t, 3);
                this.x = this.dashStartX + (this.dashEndX - this.dashStartX) * ease;

                this.dashGhostTrail.push({ x: this.x, y: this.y, alpha: 0.4 * (1 - t) });
                if (this.dashGhostTrail.length > 5) this.dashGhostTrail.shift();

                if (t >= 1) {
                    this.huyingState = 'attacking';
                    this.currentTarget = this.huyingTarget;
                    this.sprite.play('attack');
                }
                return true;
            }

            if (this.huyingState === 'attacking') {
                if (!this.huyingTarget || this.huyingTarget.dead) {
                    this.dead = true;
                    this.deathTimer = 0;
                }
                return true;
            }

            return false;
        }

        handleHuyingUltimate(dt, game) {
            if (this.ultimateState === 'dashing') {
                this.x += (this.ultimateSpeed * dt) / 1000;

                this.dashGhostTrail.push({ x: this.x, y: this.y, alpha: 0.6 });
                if (this.dashGhostTrail.length > 8) this.dashGhostTrail.shift();

                const lane = Game.getLane(this.y);
                for (const enemy of game.enemies) {
                    if (enemy.dead) continue;
                    const enemyLane = Game.getLane(enemy.y);
                    if (enemyLane === lane && Math.abs(enemy.x - this.x) < 60) {
                        enemy.hp = 0;
                        enemy.dead = true;
                        enemy.deathTimer = 0;
                        game.floatTexts.push(new FloatText(enemy.x, enemy.y - 30, '瞬杀!', '#ffd700'));
                    }
                }

                if (this.x > Game.WIDTH + 100) {
                    this.ultimateState = 'fading_out';
                    this.ultimateFadeTimer = 0;
                }
                return true;
            }

            if (this.ultimateState === 'fading_out') {
                this.ultimateFadeTimer += dt;
                this.fadeAlpha = Math.max(0, 1 - this.ultimateFadeTimer / this.ultimateFadeDuration);
                if (this.ultimateFadeTimer >= this.ultimateFadeDuration) {
                    this.dead = true;
                    this.deathTimer = 0;
                }
                return true;
            }

            return false;
        }

        takeDamage(amount) {
            if (this.shield > 0) {
                const absorbed = Math.min(this.shield, amount);
                this.shield -= absorbed;
                amount -= absorbed;
            }
            if (amount > 0) {
                this.hp -= amount;
                if (this.hp <= 0) {
                    this.hp = 0;
                    this.dead = true;
                    this.deathTimer = 0;
                }
            }
        }

        render(ctx, game) {
            let flipX = this.flipX;
            let alpha = this.fadeAlpha * this.fadeInAlpha;

            if (this.isHuyingUltimate && this.dashGhostTrail.length > 0) {
                for (let i = 0; i < this.dashGhostTrail.length; i++) {
                    const ghost = this.dashGhostTrail[i];
                    const ghostAlpha = ghost.alpha * (i / this.dashGhostTrail.length) * 0.5;
                    ctx.save();
                    ctx.globalAlpha = ghostAlpha * alpha;
                    ctx.shadowColor = '#ffd700';
                    ctx.shadowBlur = 25;
                    this.sprite.draw(ctx, ghost.x, ghost.y, flipX, 1, this.scale * 0.95);
                    ctx.restore();
                }

                ctx.save();
                ctx.globalAlpha = 0.6 * alpha;
                const trailGrad = ctx.createLinearGradient(this.x - 200, this.y, this.x, this.y);
                trailGrad.addColorStop(0, 'rgba(255, 215, 0, 0)');
                trailGrad.addColorStop(0.5, 'rgba(255, 215, 0, 0.3)');
                trailGrad.addColorStop(1, 'rgba(255, 215, 0, 0.8)');
                ctx.fillStyle = trailGrad;
                ctx.fillRect(this.x - 200, this.y - 40, 200, 80);
                ctx.restore();
            }

            if (this.isHuyingAssassin && this.dashGhostTrail.length > 0) {
                for (let i = 0; i < this.dashGhostTrail.length; i++) {
                    const ghost = this.dashGhostTrail[i];
                    const ghostAlpha = ghost.alpha * (1 - i / this.dashGhostTrail.length);
                    this.sprite.draw(ctx, ghost.x, ghost.y, flipX, ghostAlpha * this.fadeInAlpha, this.scale * 0.9);
                }
            }

            if (this.isHuyingUltimate) {
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 30;
                this.sprite.draw(ctx, this.x, this.y, flipX, 1, this.scale);
                ctx.restore();
            } else {
                this.sprite.draw(ctx, this.x, this.y, flipX, alpha, this.scale);
            }
        }
    }

    window.Game = Game;
    window.SpiritUnit = SpiritUnit;
    window.Orb = Orb;
    window.Bullet = Bullet;
})();
