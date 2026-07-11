/* ==================== 主应用入口 ==================== */
const App = {
    // Canvas 相关
    shootingCanvas: null,
    shootingCtx: null,
    phoneTargetCanvas: null,
    phoneTargetCtx: null,

    // 状态
    mouseX: 0,
    mouseY: 0,
    mouseOnCanvas: false,
    aimX: 0,
    aimY: 0,
    prevAimX: 0,
    prevAimY: 0,
    currentSpeed: 0,
    currentStability: 100,
    isOptimal: false,
    trail: [],
    shotTrails: [],        // 每发射击的完整轨迹
    currentTrailPoints: [], // 当前正在记录的轨迹点
    lastTrailTime: 0,
    lastFrameTime: 0,
    animFrame: null,
    isRunning: false,
    lastShotScores: null,

    // 轨迹回放状态
    replayActive: false,
    replayShotIndex: 0,
    replayProgress: 0,
    replayPlaying: false,

    // 训练模式
    trainMode: 'free',       // 'free' 或 'timed'
    timerRemaining: 0,       // 剩余秒数
    timerActive: false,      // 计时器是否运行
    timerStartTime: 0,       // 计时开始时间

    // 靶纸参数
    targetCX: 0,
    targetCY: 0,
    targetRadius: 0,

    // 弹道预测动画
    trajectoryAnim: null,
    bulletFlightAnim: null,  // 子弹飞行动画 {startX, startY, endX, endY, progress, time}

    init() {
        // 自动匿名登录（首次打开自动创建，零门槛）
        const user = Auth.getUser();
        Auth.updateLoginTime();
        console.log('[App] 当前用户:', user.name, '(' + user.type + ')');
        this.renderUserInfo();

        // 自动同步云端数据（新设备登录后拉取历史记录）
        if (typeof Sync !== 'undefined') {
            Sync.autoPullOnLogin().then(result => {
                if (result.success && result.stats && result.stats.cloudCount > 0) {
                    console.log('[Sync]', result.message);
                    this.showToast(result.message);
                }
            });
        }

        // 初始化设置
        Settings.init();

        // 初始化同步模块
        Sync.init();

        // 初始化靶纸校准模块
        TargetCalib.init();

        // 初始化 UI
        UI.init();

        // 获取 Canvas
        this.shootingCanvas = document.getElementById('shooting-canvas');
        this.shootingCtx = this.shootingCanvas.getContext('2d');
        this.phoneTargetCanvas = document.getElementById('phone-target-canvas');
        this.phoneTargetCtx = this.phoneTargetCanvas ? this.phoneTargetCanvas.getContext('2d') : null;

        // 鼠标事件
        this.shootingCanvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.shootingCanvas.addEventListener('mousedown', (e) => this.onTriggerDown(e));
        this.shootingCanvas.addEventListener('mouseup', (e) => this.onTriggerUp(e));
        this.shootingCanvas.addEventListener('mouseleave', (e) => { this.onTriggerUp(e); this.mouseOnCanvas = false; });
        this.shootingCanvas.addEventListener('mouseenter', () => { this.mouseOnCanvas = true; });

        // 键盘事件：数字键切枪
        document.addEventListener('keydown', (e) => this.onKeyDown(e));

        // 滚轮切枪
        this.shootingCanvas.addEventListener('wheel', (e) => this.onWheel(e));

        // 按钮事件
        UI.elements.btnRestart.addEventListener('click', () => this.restart());
        UI.elements.btnResultRestart.addEventListener('click', () => this.restart());
        UI.elements.btnResultShare.addEventListener('click', () => this.shareResult());
        const btnResultHistory = document.getElementById('btn-result-history');
        if (btnResultHistory) btnResultHistory.addEventListener('click', () => this.openHistory());
        const btnResultShareWechat = document.getElementById('btn-result-share-wechat');
        if (btnResultShareWechat) btnResultShareWechat.addEventListener('click', () => this.openSharePanel());

        // 用户头像点击
        const userInfo = document.getElementById('user-info');
        if (userInfo) userInfo.addEventListener('click', () => this.openUserProfile());

        // 设置按钮
        const btnSettings = document.getElementById('btn-settings');
        if (btnSettings) btnSettings.addEventListener('click', () => this.openSettings());
        const btnSettingsClose = document.getElementById('settings-close');
        if (btnSettingsClose) btnSettingsClose.addEventListener('click', () => this.closeSettings());
        this.initSettingsControls();

        // 靶纸选择器事件
        const targetSelect = document.getElementById('target-type-select');
        if (targetSelect) {
            targetSelect.addEventListener('change', (e) => {
                TargetTypes.switchTo(parseInt(e.target.value));
                this.updateTargetTypeUI();
            });
        }

        // 靶纸切换回调
        window.onTargetTypeChange = (type) => {
            this.updateTargetTypeUI();
            // 靶纸切换后重新识别
            this.startTargetDetection();
        };

        // 距离切换回调
        window.onDistanceChange = (distance) => {
            this.updateTargetTypeUI();
        };

        // 距离选择器事件
        const distanceSelect = document.getElementById('distance-select');
        if (distanceSelect) {
            distanceSelect.addEventListener('change', (e) => {
                DistanceSystem.switchTo(parseFloat(e.target.value));
            });
        }

        // 弹药选择器事件
        const ammoSelect = document.getElementById('ammo-select');
        if (ammoSelect) {
            ammoSelect.addEventListener('change', (e) => {
                const ammo = parseInt(e.target.value);
                Shooting.maxAmmo = ammo;
                Shooting.ammo = ammo;
                // 同步武器弹药显示
                Weapons.current.ammo = ammo;
                Weapons.current.maxAmmo = ammo;
                UI.updateAmmo(Shooting.ammo);
            });
        }

        // 模式选择器事件
        const modeSelect = document.getElementById('mode-select');
        const btnStart = document.getElementById('btn-start');
        if (modeSelect) {
            modeSelect.addEventListener('change', (e) => {
                this.trainMode = e.target.value;
                this.resetTimer();
                if (btnStart) {
                    if (this.trainMode === 'timed') {
                        btnStart.classList.add('visible');
                        // 计时挑战模式默认不限弹药
                        const ammoSelect = document.getElementById('ammo-select');
                        if (ammoSelect) ammoSelect.value = '999';
                        Shooting.maxAmmo = 999;
                        Shooting.ammo = 999;
                        UI.updateAmmo(Shooting.ammo);
                    } else {
                        btnStart.classList.remove('visible');
                        // 自由练习恢复默认弹药
                        const ammoSelect = document.getElementById('ammo-select');
                        if (ammoSelect) {
                            const ammo = parseInt(ammoSelect.value) || 10;
                            Shooting.maxAmmo = ammo;
                            Shooting.ammo = ammo;
                            UI.updateAmmo(Shooting.ammo);
                        }
                    }
                }
            });
        }

        // 开始按钮事件（计时挑战）
        if (btnStart) {
            btnStart.addEventListener('click', () => {
                if (this.trainMode === 'timed' && !this.timerActive) {
                    // 如果是"再来"，先清空上一轮记录
                    if (btnStart.textContent === '再来') {
                        Shooting.reset();
                        this.trail = [];
                        this.shotTrails = [];
                        this.currentTrailPoints = [];
                        this.closeReplay();
                        this._resultShown = false;
                        UI.resetUI();
                    }
                    this.startTimer();
                    btnStart.classList.remove('visible');
                }
            });
        }

        // 手动标定按钮
        const btnCalibrate = document.getElementById('btn-calibrate');
        if (btnCalibrate) {
            btnCalibrate.addEventListener('click', () => {
                if (TargetDetector.manualMode) {
                    // 取消标定
                    TargetDetector.cancelManualCalibration();
                    btnCalibrate.textContent = '手动标定';
                    btnCalibrate.classList.remove('active');
                    const hint = document.getElementById('calibrate-hint');
                    if (hint) hint.classList.remove('visible');
                } else {
                    // 开始标定
                    TargetDetector.startManualCalibration();
                    btnCalibrate.textContent = '取消标定';
                    btnCalibrate.classList.add('active');
                    const hint = document.getElementById('calibrate-hint');
                    if (hint) {
                        hint.textContent = '点击左上角 (0/4)';
                        hint.classList.add('visible');
                    }
                }
            });
        }

        // 初始化距离系统
        DistanceSystem.init();

        // 加载贴图、武器和靶纸
        Promise.all([
            IronSight.loadImages(),
            Weapons.init(),
            TargetTypes.init()
        ]).then(() => {
            // 初始化粒子背景
            this.initParticles();
            // 显示加载动画，完成后自动初始化
            UI.onLoadingComplete = () => {
                this.resizeCanvases();
                window.addEventListener('resize', () => this.resizeCanvases());
                this.start();
            };
            UI.showLoading();
        });
    },

    initParticles() {
        const canvas = document.getElementById('particles-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const count = 40;
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                r: Math.random() * 1.5 + 0.5,
                alpha: Math.random() * 0.3 + 0.1
            });
        }

        const draw = () => {
            if (canvas.style.display === 'none') {
                requestAnimationFrame(draw);
                return;
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const color = getComputedStyle(document.body).getPropertyValue('--cyan').trim() || '#00f0ff';
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = color.replace(')', ',' + p.alpha + ')').replace('rgb', 'rgba');
                if (!ctx.fillStyle.includes('rgba')) {
                    ctx.fillStyle = color;
                }
                ctx.globalAlpha = p.alpha;
                ctx.fill();
                ctx.globalAlpha = 1;
            });
            requestAnimationFrame(draw);
        };
        draw();
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    },

    resizeCanvases() {
        // 射击 Canvas
        const leftPanel = document.getElementById('left-panel');
        this.shootingCanvas.width = leftPanel.clientWidth;
        this.shootingCanvas.height = leftPanel.clientHeight;

        // 靶纸参数（与实际绘制位置一致，初始无视差偏移）
        const positionY = DistanceSystem.getPositionY();
        this.targetCX = this.shootingCanvas.width * 0.50 + IronSight.bgOffsetX * 0.2 + IronSight.recoilSide * 0.1;
        this.targetCY = this.shootingCanvas.height * positionY + IronSight.bgOffsetY * 0.2 - IronSight.recoilKick * 0.1;
        this.targetRadius = Math.min(this.shootingCanvas.width, this.shootingCanvas.height) * 0.14 * DistanceSystem.getSizeFactor();

        // 手机靶纸Canvas
        const phoneTargetCard = document.querySelector('.phone-target-card');
        if (phoneTargetCard && this.phoneTargetCanvas) {
            this.phoneTargetCanvas.width = phoneTargetCard.clientWidth - 16;
            this.phoneTargetCanvas.height = 180;
        }
    },

    start() {
        this.playUISound();
        this.resizeCanvases();
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        // 启动靶纸自动识别
        this.startTargetDetection();
        this.initReplayControls();
        this.initHistoryControls();
        this.loop();
    },

    stop() {
        this.isRunning = false;
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
    },

    loop() {
        if (!this.isRunning) return;

        const now = performance.now();
        const dt = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;
        const time = now / 1000;

        // 记录轨迹（基于鼠标位置，用于回放）
        if (now - this.lastTrailTime > 16) {
            const pt = { x: this.mouseX, y: this.mouseY, t: now };
            this.trail.push(pt);
            this.currentTrailPoints.push(pt);
            if (this.trail.length > 300) this.trail.shift();
            if (this.currentTrailPoints.length > 120) this.currentTrailPoints.shift();
            this.lastTrailTime = now;
        }

        // 检查最佳窗口
        this.isOptimal = Wobble.isOptimalWindow(
            this.currentSpeed, this.aimX, this.aimY,
            this.targetCX, this.targetCY, this.targetRadius
        );
        if (this.isOptimal) UI.showOptimalHint();

        // 更新机瞄视角
        const mouseNormX = this.mouseX / this.shootingCanvas.width;
        const mouseNormY = this.mouseY / this.shootingCanvas.height;
        IronSight.update(dt, time, mouseNormX, mouseNormY);

        // 更新击发动画
        Shooting.update(dt);

        // 更新弹道预测动画
        if (this.trajectoryAnim) {
            this.trajectoryAnim.progress += dt * 3;
            if (this.trajectoryAnim.progress >= 1) {
                this.trajectoryAnim.progress = 1;
            }
        }

        // 更新子弹飞行动画（从枪口到靶纸）
        if (this.bulletFlightAnim) {
            this.bulletFlightAnim.progress += dt * 4; // 0.25秒飞完
            if (this.bulletFlightAnim.progress >= 1) {
                this.bulletFlightAnim = null; // 动画结束清除
            }
        }

        // 更新当前瞄准位置
        const aimPos = IronSight.getAimPosition(this.shootingCanvas.width, this.shootingCanvas.height);
        this.aimX = aimPos.x;
        this.aimY = aimPos.y;

        // 动态更新靶纸中心（跟随视差偏移，确保弹着点与靶纸位置一致）
        const w = this.shootingCanvas.width;
        const h = this.shootingCanvas.height;
        const positionY = DistanceSystem.getPositionY();
        this.targetCX = w * 0.50 + IronSight.bgOffsetX * 0.2 + IronSight.recoilSide * 0.1;
        this.targetCY = h * positionY + IronSight.bgOffsetY * 0.2 - IronSight.recoilKick * 0.1;

        // 计算速度和稳定性（激光射击：基于鼠标移动速度）
        this.currentSpeed = Wobble.getSpeed(
            { x: this.prevMouseX || this.mouseX, y: this.prevMouseY || this.mouseY },
            { x: this.mouseX, y: this.mouseY },
            dt
        );
        this.currentStability = Utils.clamp(100 - this.currentSpeed * 0.8, 0, 100);
        this.prevMouseX = this.mouseX;
        this.prevMouseY = this.mouseY;

        // 渲染
        this.render(time);

        // 更新轨迹回放播放
        this.updateReplayPlayback(dt);

        // 更新计时器（计时挑战模式）
        if (this.trainMode === 'timed') {
            this.updateTimer(dt);
        }

        // 更新 UI
        UI.updateAimInfo(this.aimX, this.aimY);
        UI.updateStabilityBadge(this.currentStability);

        // 更新时间
        const nowDate = new Date();
        const timeStr = nowDate.getHours().toString().padStart(2, '0') + ':' + nowDate.getMinutes().toString().padStart(2, '0');
        const phoneTime = document.getElementById('phone-time');
        if (phoneTime) phoneTime.textContent = timeStr;

        // 弹匣打空或计时结束检查
        const shouldEnd = (Shooting.isEmpty() || (this.trainMode === 'timed' && this.timerRemaining <= 0));
        if (shouldEnd && !UI.elements.resultOverlay.classList.contains('hidden') === false && Shooting.shots.length > 0) {
            if (!this._resultShown) {
                this._resultShown = true;
                setTimeout(() => {
                    const summary = Scoring.calculateSessionSummary();
                    // 语音播报总成绩
                    this.speakSummary(summary);
                    // 保存训练记录到历史
                    this.saveSessionToHistory(summary);
                    UI.showResult(summary);
                    // 标记数据待同步
                    Sync.markPending();
                }, 500);
            }
        }

        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    render(time) {
        const ctx = this.shootingCtx;
        const w = this.shootingCanvas.width;
        const h = this.shootingCanvas.height;

        // 清空画布
        ctx.clearRect(0, 0, w, h);

        // 渲染机瞄视角
        IronSight.draw(ctx, w, h, time);

        if (this.replayActive) {
            this.renderReplay(ctx, w, h);
        } else {
            this.drawLaserDot(ctx);
            this.drawBulletFlight(ctx);
        }

        // 渲染手机靶纸
        this.renderPhoneTarget();
    },

    drawLaserDot(ctx) {
        // 激光点直接跟随鼠标位置，不受呼吸/后坐力等偏移影响
        const x = this.mouseX;
        const y = this.mouseY;

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 50, 50, 0.9)';
        ctx.fill();
        ctx.restore();
    },

    // 绘制子弹飞行动画（从枪口到靶纸的发光弹道）
    drawBulletFlight(ctx) {
        if (!this.bulletFlightAnim) return;
        const anim = this.bulletFlightAnim;
        const progress = anim.progress;

        ctx.save();

        // 弹道终点（弹着点）
        const endX = anim.endX;
        const endY = anim.endY;
        // 弹道起点（枪口）
        const startX = anim.startX;
        const startY = anim.startY;

        // 当前子弹位置（线性插值）
        const curX = startX + (endX - startX) * progress;
        const curY = startY + (endY - startY) * progress;

        // 绘制已飞过的轨迹线（发光效果）
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(curX, curY);
        ctx.strokeStyle = 'rgba(255, 100, 50, 0.7)';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(255, 80, 30, 0.8)';
        ctx.shadowBlur = 10;
        ctx.stroke();

        // 绘制尾焰粒子（多条渐隐短线）
        for (let i = 1; i <= 8; i++) {
            const t = progress - i * 0.03;
            if (t <= 0) continue;
            const px = startX + (endX - startX) * t;
            const py = startY + (endY - startY) * t;
            const alpha = (1 - i / 8) * 0.5;
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 150, 80, ${alpha})`;
            ctx.shadowBlur = 4;
            ctx.fill();
        }

        // 绘制子弹头部（高亮光点）
        ctx.beginPath();
        ctx.arc(curX, curY, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 230, 200, 0.95)';
        ctx.shadowColor = 'rgba(255, 150, 50, 1)';
        ctx.shadowBlur = 12;
        ctx.fill();

        // 弹着点到达时的爆炸/命中效果
        if (progress >= 0.95) {
            const hitAlpha = (progress - 0.95) / 0.05;
            ctx.beginPath();
            ctx.arc(endX, endY, 8 * hitAlpha, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 100, 50, ${0.8 * (1 - hitAlpha)})`;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 8;
            ctx.stroke();
        }

        ctx.restore();
    },

    // ========== 轨迹回放 ==========
    renderReplay(ctx, w, h) {
        const trail = this.shotTrails[this.replayShotIndex];
        if (!trail) return;
        const progress = this.replayProgress;
        ctx.save();

        // === 阶段1: 瞄准过程 (0% ~ 70%) ===
        if (trail.points.length >= 2) {
            const points = trail.points;
            const aimProgress = Math.min(1, progress / 0.7);
            const endIdx = Math.floor(aimProgress * (points.length - 1));
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            for (let i = 1; i <= endIdx && i < points.length; i++) {
                const alpha = 0.15 + 0.35 * (i / points.length);
                ctx.beginPath();
                ctx.moveTo(points[i - 1].x, points[i - 1].y);
                ctx.lineTo(points[i].x, points[i].y);
                ctx.strokeStyle = `rgba(255, 50, 50, ${alpha})`;
                ctx.stroke();
            }
            if (progress < 0.95) {
                const curPt = points[endIdx];
                ctx.beginPath();
                ctx.arc(curPt.x, curPt.y, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 50, 50, 0.6)';
                ctx.fill();
            }
        }

        // === 阶段2: 子弹飞行 (70% ~ 100%) ===
        if (progress > 0.7 && trail.muzzleX !== undefined) {
            const flightProgress = (progress - 0.7) / 0.3;
            const startX = trail.muzzleX, startY = trail.muzzleY;
            const endX = trail.impactX, endY = trail.impactY;
            const curX = startX + (endX - startX) * flightProgress;
            const curY = startY + (endY - startY) * flightProgress;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(curX, curY);
            ctx.strokeStyle = 'rgba(255, 100, 50, 0.8)';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = 'rgba(255, 80, 30, 0.9)';
            ctx.shadowBlur = 12;
            ctx.stroke();
            for (let i = 1; i <= 6; i++) {
                const t = flightProgress - i * 0.04;
                if (t <= 0) continue;
                ctx.beginPath();
                ctx.arc(startX + (endX - startX) * t, startY + (endY - startY) * t, 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 160, 80, ${(1 - i / 6) * 0.6})`;
                ctx.shadowBlur = 6;
                ctx.fill();
            }
            ctx.beginPath();
            ctx.arc(curX, curY, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 240, 220, 0.95)';
            ctx.shadowColor = 'rgba(255, 150, 50, 1)';
            ctx.shadowBlur = 15;
            ctx.fill();
            if (flightProgress >= 0.9) {
                const hitAlpha = (flightProgress - 0.9) / 0.1;
                ctx.beginPath();
                ctx.arc(endX, endY, 10 * hitAlpha, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 100, 50, ${0.9 * (1 - hitAlpha)})`;
                ctx.lineWidth = 2;
                ctx.shadowBlur = 10;
                ctx.stroke();
            }
        }

        // === 阶段3: 弹着点标记 (100%) ===
        if (progress >= 1 && trail.impactX !== undefined) {
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(trail.impactX, trail.impactY, 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(200, 50, 50, 0.9)';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(trail.impactX, trail.impactY, 7, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(200, 50, 50, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
        ctx.restore();
    },

    openReplay(shotIndex) {
        if (this.shotTrails.length === 0) return;
        this.replayActive = true;
        this.replayShotIndex = Math.max(0, Math.min(shotIndex, this.shotTrails.length - 1));
        this.replayProgress = 0;
        this.replayPlaying = false;
        const panel = document.getElementById('replay-panel');
        if (panel) panel.classList.remove('hidden');
        this.updateReplayUI();
    },

    closeReplay() {
        this.replayActive = false;
        this.replayPlaying = false;
        const panel = document.getElementById('replay-panel');
        if (panel) panel.classList.add('hidden');
    },

    updateReplayUI() {
        const trail = this.shotTrails[this.replayShotIndex];
        const label = document.getElementById('replay-shot-label');
        const scoreEl = document.getElementById('replay-shot-score');
        const slider = document.getElementById('replay-slider');
        const playBtn = document.getElementById('replay-play');
        if (label) label.textContent = `第 ${this.replayShotIndex + 1} 发`;
        if (scoreEl) scoreEl.textContent = trail ? `${trail.score}环` : '--';
        if (slider) slider.value = Math.round(this.replayProgress * 100);
        if (playBtn) playBtn.innerHTML = this.replayPlaying ? '&#10074;&#10074;' : '&#9654;';
    },

    updateReplayPlayback(dt) {
        if (!this.replayActive || !this.replayPlaying) return;
        this.replayProgress += dt * 0.5;
        if (this.replayProgress >= 1) {
            this.replayProgress = 1;
            this.replayPlaying = false;
        }
        this.updateReplayUI();
    },

    initReplayControls() {
        const slider = document.getElementById('replay-slider');
        const playBtn = document.getElementById('replay-play');
        const prevBtn = document.getElementById('replay-prev');
        const nextBtn = document.getElementById('replay-next');
        const closeBtn = document.getElementById('replay-close');
        if (slider) slider.addEventListener('input', () => { this.replayProgress = parseInt(slider.value) / 100; this.replayPlaying = false; this.updateReplayUI(); });
        if (playBtn) playBtn.addEventListener('click', () => { this.replayPlaying = !this.replayPlaying; if (this.replayPlaying && this.replayProgress >= 1) this.replayProgress = 0; this.updateReplayUI(); });
        if (prevBtn) prevBtn.addEventListener('click', () => this.openReplay(this.replayShotIndex - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => this.openReplay(this.replayShotIndex + 1));
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeReplay());
    },

    drawBackground(ctx, w, h, time) {
        // 深色渐变背景
        const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
        grad.addColorStop(0, '#111118');
        grad.addColorStop(1, '#0a0a0f');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // 网格线
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.03)';
        ctx.lineWidth = 0.5;
        const gridSize = 40;
        for (let x = 0; x < w; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // 微弱的扫描线
        ctx.fillStyle = 'rgba(0, 240, 255, 0.01)';
        const scanY = (time * 50) % h;
        ctx.fillRect(0, scanY, w, 2);
    },

    renderHeatmap() {
        if (!this.heatmapCtx || !this.heatmapCanvas) return;
        const ctx = this.heatmapCtx;
        const w = this.heatmapCanvas.width;
        const h = this.heatmapCanvas.height;
        ctx.clearRect(0, 0, w, h);

        // 背景
        ctx.fillStyle = '#0d0d14';
        ctx.fillRect(0, 0, w, h);

        // 绘制靶纸轮廓（简化版）
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // 记录当前准星位置到热力图（需要坐标映射）
        const mapX = (this.aimX / this.shootingCanvas.width) * w;
        const mapY = (this.aimY / this.shootingCanvas.height) * h;
        Heatmap.record(mapX, mapY);

        // 绘制热力图
        Heatmap.draw(ctx, w, h);
    },

    renderTrajectory() {
        if (!this.trajectoryCtx || !this.trajectoryCanvas) return;
        const ctx = this.trajectoryCtx;
        const w = this.trajectoryCanvas.width;
        const h = this.trajectoryCanvas.height;
        ctx.clearRect(0, 0, w, h);

        // 背景
        ctx.fillStyle = '#0d0d14';
        ctx.fillRect(0, 0, w, h);

        // 坐标轴
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w / 2, h);
        ctx.stroke();

        // 绘制最近的弹道预测
        if (this.trajectoryAnim) {
            const mapX = (x) => (x / this.shootingCanvas.width) * w;
            const mapY = (y) => (y / this.shootingCanvas.height) * h;

            Trajectory.draw(
                ctx,
                mapX(this.trajectoryAnim.startX),
                mapY(this.trajectoryAnim.startY),
                mapX(this.trajectoryAnim.endX),
                mapY(this.trajectoryAnim.endY),
                this.trajectoryAnim.progress
            );

            // 绘制实际弹着点
            if (this.trajectoryAnim.progress >= 1) {
                ctx.beginPath();
                ctx.arc(
                    mapX(this.trajectoryAnim.actualX),
                    mapY(this.trajectoryAnim.actualY),
                    3, 0, Math.PI * 2
                );
                ctx.fillStyle = '#ff2a6d';
                ctx.shadowColor = '#ff2a6d';
                ctx.shadowBlur = 6;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        // 绘制历史弹着点（小点）
        const mapX = (x) => (x / this.shootingCanvas.width) * w;
        const mapY = (y) => (y / this.shootingCanvas.height) * h;
        for (const imp of Shooting.impacts) {
            ctx.beginPath();
            ctx.arc(mapX(imp.x), mapY(imp.y), 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 42, 109, 0.5)';
            ctx.fill();
        }
    },

    renderPhoneTarget() {
        if (!this.phoneTargetCanvas) return;
        const ctx = this.phoneTargetCtx;
        const w = this.phoneTargetCanvas.width;
        const h = this.phoneTargetCanvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const type = TargetTypes.current;

        ctx.clearRect(0, 0, w, h);

        // 优先使用靶纸贴图
        const img = TargetTypes.getImage();
        if (img && img.complete && img.naturalWidth > 0) {
            // 计算贴图绘制区域（保持比例，居中填充）
            const imgRatio = img.naturalWidth / img.naturalHeight;
            const canvasRatio = w / h;
            let drawW, drawH, drawX, drawY;
            if (imgRatio > canvasRatio) {
                drawW = w;
                drawH = w / imgRatio;
                drawX = 0;
                drawY = (h - drawH) / 2;
            } else {
                drawH = h;
                drawW = h * imgRatio;
                drawX = (w - drawW) / 2;
                drawY = 0;
            }
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
        } else {
            // 回退：简化绘制
            this.drawFallbackPhoneTarget(ctx, w, h, cx, cy, type);
        }

        // 绘制弹着点（统一坐标映射：以靶纸中心为原点按比例缩放）
        const phoneRadius = Math.min(w, h) * 0.4;
        const scale = phoneRadius / this.targetRadius;
        for (const imp of Shooting.impacts) {
            const impX = cx + (imp.x - this.targetCX) * scale;
            const impY = cy + (imp.y - this.targetCY) * scale;

            // 弹孔
            ctx.beginPath();
            ctx.arc(impX, impY, 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(200, 50, 50, 0.9)';
            ctx.fill();
            // 外圈
            ctx.beginPath();
            ctx.arc(impX, impY, 5, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(200, 50, 50, 0.6)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    },

    drawFallbackPhoneTarget(ctx, w, h, cx, cy, type) {
        // 背景
        ctx.fillStyle = '#f5f0e8';
        ctx.fillRect(0, 0, w, h);

        if (type.id === 'human') {
            // 简化人形
            ctx.fillStyle = '#1a1a1a';
            // 头
            ctx.beginPath();
            ctx.arc(cx, cy - h * 0.25, h * 0.08, 0, Math.PI * 2);
            ctx.fill();
            // 身体
            ctx.fillRect(cx - h * 0.1, cy - h * 0.15, h * 0.2, h * 0.35);
            // 四肢
            ctx.fillRect(cx - h * 0.18, cy - h * 0.1, h * 0.06, h * 0.3);
            ctx.fillRect(cx + h * 0.12, cy - h * 0.1, h * 0.06, h * 0.3);
            ctx.fillRect(cx - h * 0.08, cy + h * 0.18, h * 0.06, h * 0.25);
            ctx.fillRect(cx + h * 0.02, cy + h * 0.18, h * 0.06, h * 0.25);
        } else if (type.id === 'ipsc') {
            // IPSC梯形
            ctx.fillStyle = '#f5f0e8';
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx - w * 0.15, cy - h * 0.35);
            ctx.lineTo(cx + w * 0.15, cy - h * 0.35);
            ctx.lineTo(cx + w * 0.22, cy + h * 0.35);
            ctx.lineTo(cx - w * 0.22, cy + h * 0.35);
            ctx.closePath();
            ctx.stroke();
            // A区
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.ellipse(cx, cy - h * 0.05, w * 0.06, h * 0.1, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (type.id === 'idpa') {
            // IDPA梯形
            ctx.fillStyle = '#f5f0e8';
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx - w * 0.18, cy - h * 0.38);
            ctx.lineTo(cx + w * 0.18, cy - h * 0.38);
            ctx.lineTo(cx + w * 0.2, cy + h * 0.38);
            ctx.lineTo(cx - w * 0.2, cy + h * 0.38);
            ctx.closePath();
            ctx.stroke();
            // 0区
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.ellipse(cx, cy - h * 0.05, w * 0.05, h * 0.12, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // 默认：同心圆靶
            const radius = Math.min(w, h) * 0.4;
            for (let i = 10; i >= 1; i--) {
                const r = (radius * i) / 10;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                if (i <= 2) { ctx.fillStyle = '#1a1a1a'; ctx.fill(); }
                else if (i <= 4) { ctx.fillStyle = '#e8e0d0'; ctx.fill(); }
                ctx.strokeStyle = i <= 4 ? '#333' : '#999';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy);
            ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius);
            ctx.stroke();
        }
    },

    onMouseMove(e) {
        const rect = this.shootingCanvas.getBoundingClientRect();
        // 鼠标坐标直接映射为Canvas坐标（无缩放）
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
    },

    onTriggerDown(e) {
        if (e.button !== 0) return; // 只响应左键

        // 手动标定模式：收集角点
        if (TargetDetector.manualMode) {
            const rect = this.shootingCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const completed = TargetDetector.addManualPoint(x, y);
            if (completed) {
                // 标定完成
                const btnCalibrate = document.getElementById('btn-calibrate');
                const hint = document.getElementById('calibrate-hint');
                if (btnCalibrate) {
                    btnCalibrate.textContent = '手动标定';
                    btnCalibrate.classList.remove('active');
                }
                if (hint) hint.classList.remove('visible');
                App.setDetectionStatus('靶纸已标定', 'detected');
                setTimeout(() => App.hideDetectionStatus(), 3000);
            } else {
                // 更新提示
                const hint = document.getElementById('calibrate-hint');
                if (hint) {
                    const nextLabel = TargetDetector.manualLabels[TargetDetector.manualPoints.length];
                    hint.textContent = `点击${nextLabel}角 (${TargetDetector.manualPoints.length}/4)`;
                }
            }
            return;
        }

        if (Shooting.isEmpty()) return;
        this.fireShot();
    },

    onTriggerUp(e) {
        // 机瞄模式下点击即射击，不需要按住
    },

    // ========== 语音即时反馈 ==========
    speak(text) {
        const voiceEnabled = document.getElementById('setting-voice');
        if (!voiceEnabled || !voiceEnabled.checked) return;
        if (!window.speechSynthesis) return;
        // 取消之前的播报，避免队列堆积
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'zh-CN';
        utter.rate = 1.1;
        utter.pitch = 1;
        window.speechSynthesis.speak(utter);
    },

    speakShot(shot) {
        if (!shot) return;
        const ring = shot.ring;
        const score = shot.score;
        let text = '';
        if (ring <= 0) {
            text = '脱靶';
        } else {
            text = ring + '环';
        }
        // 偏差提示
        const dx = shot.impactX - this.targetCX;
        const dy = shot.impactY - this.targetCY;
        const threshold = this.targetRadius * 0.15;
        if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
            const dirs = [];
            if (dy < -threshold) dirs.push('偏上');
            if (dy > threshold) dirs.push('偏下');
            if (dx < -threshold) dirs.push('偏左');
            if (dx > threshold) dirs.push('偏右');
            if (dirs.length > 0) text += '，' + dirs.join('');
        }
        this.speak(text);
    },

    speakSummary(summary) {
        if (!summary) return;
        const shots = summary.shotCount || 0;
        const avg = summary.avgRing ? summary.avgRing.toFixed(1) : '0';
        const spread = summary.spread ? Math.round(summary.spread) : 0;
        let text = '本次' + shots + '发，平均' + avg + '环';
        if (spread < 30) text += '，散布优秀';
        else if (spread < 60) text += '，散布良好';
        else if (spread < 100) text += '，散布一般';
        else text += '，散布偏大';
        this.speak(text);
    },

    onKeyDown(e) {
        // 数字键 1/2/3 切枪
        if (e.key === '1') Weapons.switchByIndex(0);
        else if (e.key === '2') Weapons.switchByIndex(1);
        else if (e.key === '3') Weapons.switchByIndex(2);
    },

    onWheel(e) {
        if (e.deltaY > 0) {
            Weapons.switchNext();
        } else {
            Weapons.switchPrev();
        }
    },

    // ========== 音效播放 ==========
    _audioCtx: null,
    _getAudioCtx() {
        if (!this._audioCtx) {
            this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this._audioCtx;
    },

    playShotSound() {
        const enabled = document.getElementById('setting-sound-shot');
        if (!enabled || !enabled.checked) return;
        try {
            const ctx = this._getAudioCtx();
            const now = ctx.currentTime;
            // 噪声缓冲（模拟枪声爆裂）
            const bufferSize = ctx.sampleRate * 0.15;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            // 低频振荡（模拟枪管共鸣）
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
            // 增益包络
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            // 滤波器
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(3000, now);
            filter.frequency.exponentialRampToValueAtTime(200, now + 0.1);
            // 连接
            noise.connect(filter);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            noise.start(now);
            noise.stop(now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } catch (e) {}
    },

    playUISound() {
        const enabled = document.getElementById('setting-sound-ui');
        if (!enabled || !enabled.checked) return;
        try {
            const ctx = this._getAudioCtx();
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.exponentialRampToValueAtTime(1800, now + 0.03);
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.06);
        } catch (e) {}
    },

    fireShot() {
        if (Shooting.isEmpty()) return;

        // 计时挑战模式下，计时器未激活时不能射击
        if (this.trainMode === 'timed' && !this.timerActive) {
            UI.setHint('点击"开始"按钮启动计时');
            return;
        }

        // 获取当前瞄准位置（用于视觉效果和稳定性计算）
        const aimPos = IronSight.getAimPosition(this.shootingCanvas.width, this.shootingCanvas.height);
        this.aimX = aimPos.x;
        this.aimY = aimPos.y;

        // 击发：弹着点基准使用鼠标位置（激光点位置），不受视觉晃动偏移影响
        // 激光射击散布极小，忽略武器自带散布
        const shot = Shooting.fire(this.mouseX, this.mouseY, this.currentStability, this.currentSpeed, 0.005);
        if (!shot) return;

        // 触发枪口闪光和后坐力
        IronSight.fire();
        this.playShotSound();

        // 保存当前射击轨迹（从瞄准到击发的完整轨迹）
        const muzzlePos = IronSight.getMuzzlePosition(this.shootingCanvas.width, this.shootingCanvas.height);
        this.shotTrails.push({
            points: [...this.currentTrailPoints],
            fireTime: performance.now(),
            score: 0,
            muzzleX: muzzlePos.x,
            muzzleY: muzzlePos.y,
            impactX: shot.impactX,
            impactY: shot.impactY
        });
        this.currentTrailPoints = [];

        // 计算环数（使用当前靶纸类型的计分规则）
        const dist = Utils.distance(shot.impactX, shot.impactY, this.targetCX, this.targetCY);
        const result = TargetTypes.calculateScore(dist, this.targetRadius);
        shot.score = result.score;
        shot.ring = result.ring;
        Shooting.impacts[Shooting.impacts.length - 1].score = result.score;

        // 更新轨迹回放中的分数
        if (this.shotTrails.length > 0) {
            this.shotTrails[this.shotTrails.length - 1].score = result.ring;
        }

        // 计算评分
        const scores = Scoring.calculateShotScore(shot, this.targetCX, this.targetCY, this.targetRadius);
        this.lastShotScores = scores;

        // 更新 UI
        UI.showFlash();
        UI.updateAmmo(Shooting.ammo);
        UI.updateTotalScore(Shooting.getRecentScore(10));
        UI.updateScorePanel(scores);
        UI.addShotRecord(shot, Shooting.shots.length);
        UI.updateTrajectoryBadge(Shooting.shots.length);

        // 语音反馈
        this.speakShot(shot);

        // 启动弹道预测动画（手机靶纸）
        this.trajectoryAnim = {
            startX: shot.aimX,
            startY: shot.aimY,
            endX: shot.impactX,
            endY: shot.impactY,
            actualX: shot.impactX,
            actualY: shot.impactY,
            progress: 0
        };

        // 启动子弹飞行动画（主画面：从枪口到弹着点）
        this.bulletFlightAnim = {
            startX: muzzlePos.x,
            startY: muzzlePos.y,
            endX: shot.impactX,
            endY: shot.impactY,
            progress: 0
        };

        // 更新提示
        if (Shooting.ammo > 0) {
            UI.setHint('剩余 ' + Shooting.ammo + ' 发 - 移动鼠标瞄准，点击左键射击');
        } else {
            UI.setHint('弹匣已空 - 生成训练报告...');
            this._resultShown = false;
        }
    },

    onShoot(e) {
        // 兼容旧版本，直接调用 fireShot
        this.onTriggerDown({ button: 0 });
        setTimeout(() => {
            this.onTriggerUp({ button: 0, type: 'mouseup' });
        }, 500);
    },

    startTimer() {
        this.timerRemaining = 90;
        this.timerActive = true;
        this.timerStartTime = performance.now();
        UI.updateTimer(this.timerRemaining);
    },

    resetTimer() {
        this.timerActive = false;
        this.timerRemaining = 0;
        UI.updateTimer(0);
    },

    updateTimer(dt) {
        if (!this.timerActive) return;
        this.timerRemaining -= dt;
        if (this.timerRemaining <= 0) {
            this.timerRemaining = 0;
            this.timerActive = false;
            // 时间到，显示开始按钮可重新开始
            const btnStart = document.getElementById('btn-start');
            if (btnStart && this.trainMode === 'timed') {
                btnStart.textContent = '再来';
                btnStart.classList.add('visible');
            }
            // 结束训练并显示结果
            if (Shooting.shots.length > 0) {
                const summary = Scoring.calculateSessionSummary();
                this.speakSummary(summary);
                this.saveSessionToHistory(summary);
                UI.showResult(summary);
            }
        }
        UI.updateTimer(Math.ceil(this.timerRemaining));
    },

    restart() {
        Weapons.reset();
        TargetTypes.reset();
        Shooting.reset();
        Heatmap.reset(300, 200);
        IronSight.reset();
        DistanceSystem.reset();
        this.trail = [];
        this.shotTrails = [];
        this.currentTrailPoints = [];
        this.closeReplay();
        this.trajectoryAnim = null;
        this.bulletFlightAnim = null;
        this._resultShown = false;
        this.lastShotScores = null;
        this.mouseX = this.shootingCanvas.width / 2;
        this.mouseY = this.shootingCanvas.height / 2;
        // 重置模式选择器
        const modeSelect = document.getElementById('mode-select');
        if (modeSelect) modeSelect.value = 'free';
        this.trainMode = 'free';
        this.resetTimer();
        // 重置开始按钮
        const btnStart = document.getElementById('btn-start');
        if (btnStart) {
            btnStart.textContent = '开始';
            btnStart.classList.remove('visible');
        }
        // 距离选择器保持不变
        // 重置距离选择器
        const distanceSelect = document.getElementById('distance-select');
        if (distanceSelect) distanceSelect.value = '10';
        // 重置弹药选择器
        const ammoSelect = document.getElementById('ammo-select');
        if (ammoSelect) ammoSelect.value = '10';
        // 重置弹药为10发
        Shooting.maxAmmo = 10;
        this.updateTargetTypeUI();
        UI.resetUI();
        UI.setHint('移动鼠标瞄准，点击左键射击 | 1/2/3 切枪 | Q/E 滚轮切换');
    },

    updateTargetTypeUI() {
        const type = TargetTypes.current;
        const sessionTarget = document.getElementById('session-target');
        if (sessionTarget) {
            sessionTarget.textContent = DistanceSystem.getDistanceLabel() + ' ' + type.name;
        }
        const phoneDistance = document.getElementById('phone-distance');
        if (phoneDistance) phoneDistance.textContent = DistanceSystem.getDistanceLabel();
    },

    // 更新识别状态UI
    setDetectionStatus(text, state) {
        const el = document.getElementById('detection-status');
        if (!el) return;
        el.textContent = text;
        el.className = 'detection-status visible' + (state ? ' ' + state : '');
    },

    hideDetectionStatus() {
        const el = document.getElementById('detection-status');
        if (el) el.classList.remove('visible');
    },

    // 启动靶纸自动识别（3秒）
    startTargetDetection() {
        this.setDetectionStatus('靶纸识别中...', '');
        TargetDetector.startDetection(
            (progress) => {
                // 扫描进度
                this.setDetectionStatus(`扫描中... ${Math.round(progress * 100)}%`, '');
            },
            (result) => {
                // 识别完成
                if (result && result.confidence >= 0.3) {
                    this.setDetectionStatus('靶纸已识别', 'detected');
                    setTimeout(() => this.hideDetectionStatus(), 3000);
                } else {
                    this.setDetectionStatus('未检测到靶纸', 'failed');
                    setTimeout(() => this.hideDetectionStatus(), 3000);
                }
            }
        );
    },

    // ========== 历史记录 ==========
    saveSessionToHistory(summary) {
        const now = new Date();
        const session = {
            id: now.getTime(),
            date: now.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/\//g, '-'),
            timestamp: now.getTime(),
            targetType: TargetTypes.current.name,
            targetTypeId: TargetTypes.currentIndex,
            distance: DistanceSystem.getDistanceLabel(),
            distanceId: DistanceSystem.current,
            mode: this.trainMode,
            shotsCount: Shooting.shots.length,
            totalScore: summary.totalScore,
            avgRing: summary.avgRing,
            bestShot: summary.bestShot,
            spread: summary.spread,
            grade: summary.grade,
            shots: Shooting.shots.map(s => ({
                x: s.x, y: s.y,
                impactX: s.impactX, impactY: s.impactY,
                score: s.score, ring: s.ring,
                time: s.time, stability: s.stability, speed: s.speed
            })),
            impacts: Shooting.impacts.map(i => ({ x: i.x, y: i.y, score: i.score })),
            targetCX: this.targetCX,
            targetCY: this.targetCY,
            targetRadius: this.targetRadius,
            // 截取靶纸实况canvas作为快照（确保详情页显示与实况完全一致）
            phoneTargetSnapshot: this.phoneTargetCanvas ? this.phoneTargetCanvas.toDataURL('image/png') : null
        };
        History.save(session);
        this.updateCheckin();
    },

    // 打开历史记录列表
    openHistory() {
        this.playUISound();
        const overlay = document.getElementById('history-overlay');
        if (overlay) overlay.classList.remove('hidden');
        this.renderHistoryList();
    },

    closeHistory() {
        this.playUISound();
        const overlay = document.getElementById('history-overlay');
        if (overlay) overlay.classList.add('hidden');
    },

    // 渲染深度分析
    renderAnalysis() {
        const records = History.getAll();
        if (records.length < 2) {
            this._clearAnalysis('数据不足，至少需要 2 条训练记录才能生成分析');
            return;
        }
        // 1. 长期趋势
        this._drawTrendChart(records);
        // 2. 靶纸类型对比
        this._drawTargetChart(records);
        // 3. 距离对比
        this._drawDistanceChart(records);
        // 4. 弱项诊断
        this._drawRadarAndDiagnosis(records);
    },

    _clearAnalysis(msg) {
        ['chart-trend', 'chart-target', 'chart-distance', 'chart-radar'].forEach(id => {
            const c = document.getElementById(id);
            if (c) { const ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height); }
        });
        ['trend-legend', 'target-legend', 'distance-legend', 'weak-diagnosis'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<span style="color:var(--text-dim);font-size:12px;">' + (msg || '暂无数据') + '</span>';
        });
    },

    _drawTrendChart(records) {
        const canvas = document.getElementById('chart-trend');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // 按日期分组，取每日平均
        const daily = {};
        records.forEach(r => {
            const d = r.date.split(' ')[0];
            if (!daily[d]) daily[d] = [];
            daily[d].push(r.avgRing || 0);
        });
        const labels = Object.keys(daily).sort();
        const data = labels.map(d => {
            const arr = daily[d];
            return arr.reduce((a, b) => a + b, 0) / arr.length;
        });
        if (data.length < 2) return;

        const padding = { top: 20, right: 20, bottom: 30, left: 36 };
        const cw = w - padding.left - padding.right;
        const ch = h - padding.top - padding.bottom;
        const maxVal = Math.max(...data, 10);
        const minVal = Math.min(...data, 0);
        const range = maxVal - minVal || 1;

        // 网格线
        ctx.strokeStyle = 'rgba(0,240,255,0.08)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + ch * (i / 4);
            ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(padding.left + cw, y); ctx.stroke();
        }

        // Y轴标签
        ctx.fillStyle = 'var(--text-dim)';
        ctx.font = '10px ' + getComputedStyle(document.body).getPropertyValue('--font-mono');
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const val = maxVal - range * (i / 4);
            ctx.fillText(val.toFixed(1), padding.left - 6, padding.top + ch * (i / 4) + 3);
        }

        // 折线
        const color = getComputedStyle(document.body).getPropertyValue('--cyan').trim() || '#00f0ff';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        data.forEach((v, i) => {
            const x = padding.left + (cw * i / (data.length - 1));
            const y = padding.top + ch * (1 - (v - minVal) / range);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // 数据点
        data.forEach((v, i) => {
            const x = padding.left + (cw * i / (data.length - 1));
            const y = padding.top + ch * (1 - (v - minVal) / range);
            ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = color; ctx.fill();
        });

        // X轴标签（显示部分日期）
        ctx.fillStyle = 'var(--text-dim)';
        ctx.font = '9px ' + getComputedStyle(document.body).getPropertyValue('--font-mono');
        ctx.textAlign = 'center';
        const step = Math.max(1, Math.floor(labels.length / 5));
        labels.forEach((d, i) => {
            if (i % step === 0 || i === labels.length - 1) {
                const x = padding.left + (cw * i / (data.length - 1));
                const short = d.slice(5); // MM-DD
                ctx.fillText(short, x, h - 10);
            }
        });

        // 图例
        const legend = document.getElementById('trend-legend');
        if (legend) legend.innerHTML = '<div class="analysis-legend-item"><span class="analysis-legend-dot" style="background:' + color + '"></span><span>日均平均环数</span></div>';
    },

    _drawTargetChart(records) {
        const canvas = document.getElementById('chart-target');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const map = {};
        records.forEach(r => {
            const k = r.targetType || '未知';
            if (!map[k]) map[k] = [];
            map[k].push(r.avgRing || 0);
        });
        const labels = Object.keys(map);
        const data = labels.map(k => map[k].reduce((a, b) => a + b, 0) / map[k].length);
        if (data.length === 0) return;

        const padding = { top: 16, right: 16, bottom: 40, left: 36 };
        const cw = w - padding.left - padding.right;
        const ch = h - padding.top - padding.bottom;
        const maxVal = Math.max(...data, 10);
        const barW = Math.min(40, (cw / data.length) * 0.6);
        const gap = (cw - barW * data.length) / (data.length + 1);
        const colors = ['#00f0ff', '#ff2a6d', '#05ffa1', '#ffcc00', '#b967ff'];

        // 网格
        ctx.strokeStyle = 'rgba(0,240,255,0.08)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + ch * (i / 4);
            ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(padding.left + cw, y); ctx.stroke();
        }
        ctx.fillStyle = 'var(--text-dim)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            ctx.fillText((maxVal * (1 - i / 4)).toFixed(1), padding.left - 6, padding.top + ch * (i / 4) + 3);
        }

        data.forEach((v, i) => {
            const x = padding.left + gap + i * (barW + gap);
            const bh = ch * (v / maxVal);
            const y = padding.top + ch - bh;
            ctx.fillStyle = colors[i % colors.length];
            ctx.globalAlpha = 0.7;
            ctx.fillRect(x, y, barW, bh);
            ctx.globalAlpha = 1;
            // 数值
            ctx.fillStyle = 'var(--text-primary)';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(v.toFixed(1), x + barW / 2, y - 4);
            // 标签
            ctx.fillStyle = 'var(--text-dim)';
            ctx.font = '9px sans-serif';
            const short = labels[i].length > 6 ? labels[i].slice(0, 6) + '...' : labels[i];
            ctx.fillText(short, x + barW / 2, h - 10);
        });

        // 图例
        const legend = document.getElementById('target-legend');
        if (legend) {
            legend.innerHTML = labels.map((k, i) => '<div class="analysis-legend-item"><span class="analysis-legend-dot" style="background:' + colors[i % colors.length] + '"></span><span>' + k + '</span></div>').join('');
        }
    },

    _drawDistanceChart(records) {
        const canvas = document.getElementById('chart-distance');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const map = {};
        records.forEach(r => {
            const k = r.distance || '未知';
            if (!map[k]) map[k] = [];
            map[k].push(r.avgRing || 0);
        });
        const labels = Object.keys(map).sort((a, b) => parseInt(a) - parseInt(b));
        const data = labels.map(k => map[k].reduce((a, b) => a + b, 0) / map[k].length);
        if (data.length === 0) return;

        const padding = { top: 16, right: 16, bottom: 40, left: 36 };
        const cw = w - padding.left - padding.right;
        const ch = h - padding.top - padding.bottom;
        const maxVal = Math.max(...data, 10);
        const barW = Math.min(40, (cw / data.length) * 0.6);
        const gap = (cw - barW * data.length) / (data.length + 1);
        const colors = ['#00f0ff', '#ff2a6d', '#05ffa1', '#ffcc00', '#b967ff'];

        ctx.strokeStyle = 'rgba(0,240,255,0.08)';
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + ch * (i / 4);
            ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(padding.left + cw, y); ctx.stroke();
        }
        ctx.fillStyle = 'var(--text-dim)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            ctx.fillText((maxVal * (1 - i / 4)).toFixed(1), padding.left - 6, padding.top + ch * (i / 4) + 3);
        }

        data.forEach((v, i) => {
            const x = padding.left + gap + i * (barW + gap);
            const bh = ch * (v / maxVal);
            const y = padding.top + ch - bh;
            ctx.fillStyle = colors[i % colors.length];
            ctx.globalAlpha = 0.7;
            ctx.fillRect(x, y, barW, bh);
            ctx.globalAlpha = 1;
            ctx.fillStyle = 'var(--text-primary)';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(v.toFixed(1), x + barW / 2, y - 4);
            ctx.fillStyle = 'var(--text-dim)';
            ctx.font = '9px sans-serif';
            ctx.fillText(labels[i], x + barW / 2, h - 10);
        });

        const legend = document.getElementById('distance-legend');
        if (legend) {
            legend.innerHTML = labels.map((k, i) => '<div class="analysis-legend-item"><span class="analysis-legend-dot" style="background:' + colors[i % colors.length] + '"></span><span>' + k + '</span></div>').join('');
        }
    },

    _drawRadarAndDiagnosis(records) {
        const canvas = document.getElementById('chart-radar');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // 计算维度
        let totalStability = 0, totalSpread = 0, totalSpeed = 0, totalScore = 0, count = 0;
        let leftCount = 0, rightCount = 0, upCount = 0, downCount = 0;
        records.forEach(r => {
            totalScore += r.avgRing || 0;
            if (r.shots && r.shots.length > 0) {
                r.shots.forEach(s => {
                    totalStability += s.stability || 0;
                    totalSpeed += s.speed || 0;
                    if (s.x < 0) leftCount++; else if (s.x > 0) rightCount++;
                    if (s.y < 0) downCount++; else if (s.y > 0) upCount++;
                });
                count += r.shots.length;
                totalSpread += r.spread || 0;
            }
        });

        const dims = [
            { name: '稳定性', val: count ? totalStability / count : 0, max: 10 },
            { name: '精度', val: count ? (10 - totalSpread / records.length) : 0, max: 10 },
            { name: '速度', val: count ? totalSpeed / count : 0, max: 10 },
            { name: '成绩', val: records.length ? totalScore / records.length : 0, max: 10 }
        ];
        dims.forEach(d => { if (d.val < 0) d.val = 0; if (d.val > d.max) d.val = d.max; });

        // 雷达图
        const cx = w / 2, cy = h / 2, r = Math.min(cx, cy) - 20;
        const n = dims.length;
        ctx.strokeStyle = 'rgba(0,240,255,0.15)';
        ctx.lineWidth = 1;
        for (let layer = 1; layer <= 4; layer++) {
            ctx.beginPath();
            for (let i = 0; i < n; i++) {
                const a = (Math.PI * 2 * i / n) - Math.PI / 2;
                const x = cx + Math.cos(a) * r * (layer / 4);
                const y = cy + Math.sin(a) * r * (layer / 4);
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.closePath(); ctx.stroke();
        }
        // 轴线
        for (let i = 0; i < n; i++) {
            const a = (Math.PI * 2 * i / n) - Math.PI / 2;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.stroke();
            ctx.fillStyle = 'var(--text-dim)';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            const lx = cx + Math.cos(a) * (r + 14);
            const ly = cy + Math.sin(a) * (r + 14);
            ctx.fillText(dims[i].name, lx, ly + 3);
        }
        // 数据区域
        const color = getComputedStyle(document.body).getPropertyValue('--cyan').trim() || '#00f0ff';
        ctx.beginPath();
        dims.forEach((d, i) => {
            const a = (Math.PI * 2 * i / n) - Math.PI / 2;
            const ratio = d.val / d.max;
            const x = cx + Math.cos(a) * r * ratio;
            const y = cy + Math.sin(a) * r * ratio;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = color.replace(')', ',0.2)').replace('rgb', 'rgba');
        if (!ctx.fillStyle.includes('rgba')) ctx.fillStyle = color + '33';
        ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
        dims.forEach((d, i) => {
            const a = (Math.PI * 2 * i / n) - Math.PI / 2;
            const ratio = d.val / d.max;
            const x = cx + Math.cos(a) * r * ratio;
            const y = cy + Math.sin(a) * r * ratio;
            ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = color; ctx.fill();
        });

        // 弱项诊断文字
        const diagnoses = [];
        const avgScore = records.length ? totalScore / records.length : 0;
        if (avgScore < 7) diagnoses.push({ label: '整体成绩偏低', text: '平均环数 ' + avgScore.toFixed(1) + '，建议加强基础姿势和扳机控制训练。' });
        const avgStability = count ? totalStability / count : 0;
        if (avgStability < 6) diagnoses.push({ label: '稳定性不足', text: '击发稳定性评分较低，建议降低击发速度，注重呼吸节奏控制。' });
        const avgSpread = records.length ? totalSpread / records.length : 0;
        if (avgSpread > 80) diagnoses.push({ label: '散布偏大', text: '弹着点散布半径 ' + avgSpread.toFixed(0) + 'mm，建议检查据枪姿势一致性。' });
        if (leftCount > rightCount * 1.5) diagnoses.push({ label: '偏左倾向', text: '弹着点明显偏左，可能是扳机预压过度或握把过紧导致。' });
        else if (rightCount > leftCount * 1.5) diagnoses.push({ label: '偏右倾向', text: '弹着点明显偏右，可能是扳机扣动时食指发力不均。' });
        if (upCount > downCount * 1.5) diagnoses.push({ label: '偏高倾向', text: '弹着点偏高，可能是准星遮挡过多或呼吸配合不当。' });
        else if (downCount > upCount * 1.5) diagnoses.push({ label: '偏低倾向', text: '弹着点偏低，可能是击发瞬间手腕下沉或准星偏低。' });
        if (diagnoses.length === 0) {
            diagnoses.push({ label: '表现良好', text: '整体数据较为均衡，继续保持当前训练节奏，可尝试增加距离或缩短时间挑战。' });
        }

        const diagEl = document.getElementById('weak-diagnosis');
        if (diagEl) {
            diagEl.innerHTML = diagnoses.map(d => '<div class="weak-item"><span class="weak-dot"></span><span><span class="weak-label">' + d.label + '：</span>' + d.text + '</span></div>').join('');
        }
    },

    // 渲染历史记录列表
    renderHistoryList() {
        const listEl = document.getElementById('history-list');
        const countEl = document.getElementById('history-count');
        if (!listEl) return;

        // 获取筛选条件
        const filters = {
            targetType: document.getElementById('history-filter-type')?.value || '',
            dateFrom: document.getElementById('history-filter-from')?.value || '',
            dateTo: document.getElementById('history-filter-to')?.value || '',
            scoreMin: document.getElementById('history-filter-min')?.value || '',
            scoreMax: document.getElementById('history-filter-max')?.value || '',
            searchText: document.getElementById('history-search')?.value || ''
        };

        let records = History.getAll();
        records = History.filter(records, filters);

        if (countEl) countEl.textContent = `共 ${records.length} 条记录`;

        if (records.length === 0) {
            listEl.innerHTML = '<div class="history-empty">暂无训练记录</div>';
            return;
        }

        listEl.innerHTML = records.map(r => `
            <div class="history-item" data-id="${r.id}">
                <span class="history-item-date">${r.date}</span>
                <span class="history-item-type">${r.targetType}</span>
                <span class="history-item-shots">${r.shotsCount}发</span>
                <span class="history-item-score">${r.totalScore}</span>
                <span class="history-item-grade">${r.grade}</span>
            </div>
        `).join('');

        // 绑定点击事件
        listEl.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.dataset.id);
                this.openDetail(id);
            });
        });
    },

    // 打开训练详情
    openDetail(id) {
        const record = History.getById(id);
        if (!record) return;

        const overlay = document.getElementById('detail-overlay');
        if (overlay) overlay.classList.remove('hidden');

        // 填充详情
        const dateEl = document.getElementById('detail-date');
        const gradeEl = document.getElementById('detail-grade');
        const subtitleEl = document.getElementById('detail-subtitle');
        const statsEl = document.getElementById('detail-stats');
        const shotsListEl = document.getElementById('detail-shots-list');

        if (dateEl) dateEl.textContent = record.date;
        if (gradeEl) gradeEl.textContent = record.grade;
        if (subtitleEl) subtitleEl.textContent = `${record.targetType} · ${record.distance} · ${record.shotsCount}发`;

        if (statsEl) {
            statsEl.innerHTML = `
                <div class="detail-stat-item"><div class="detail-stat-value">${record.totalScore}</div><div class="detail-stat-label">总分</div></div>
                <div class="detail-stat-item"><div class="detail-stat-value">${record.avgRing}</div><div class="detail-stat-label">平均环数</div></div>
                <div class="detail-stat-item"><div class="detail-stat-value">${record.bestShot}</div><div class="detail-stat-label">最佳单发</div></div>
                <div class="detail-stat-item"><div class="detail-stat-value">${record.spread}</div><div class="detail-stat-label">散布半径</div></div>
                <div class="detail-stat-item"><div class="detail-stat-value">${record.shotsCount}</div><div class="detail-stat-label">射击次数</div></div>
                <div class="detail-stat-item"><div class="detail-stat-value">${record.grade}</div><div class="detail-stat-label">等级</div></div>
            `;
        }

        if (shotsListEl) {
            shotsListEl.innerHTML = record.shots.map((s, i) => `
                <div class="detail-shot-item">
                    <div class="detail-shot-index">#${i + 1}</div>
                    <div class="detail-shot-ring">${typeof s.ring === 'number' ? s.ring + '环' : s.ring}</div>
                    <div class="detail-shot-score">${s.score.toFixed(1)}</div>
                </div>
            `).join('');
        }

        // 绘制靶纸图
        this.drawDetailTarget(record);
    },

    closeDetail() {
        const overlay = document.getElementById('detail-overlay');
        if (overlay) overlay.classList.add('hidden');
    },

    // 绘制详情页靶纸图（优先使用靶纸实况快照）
    drawDetailTarget(record) {
        const canvas = document.getElementById('detail-canvas');
        const img = document.getElementById('detail-snapshot');
        const hint = document.getElementById('detail-canvas-hint');
        if (!canvas || !img) return;

        // 隐藏canvas点击放大相关
        if (this._detailCanvasHandler) {
            canvas.removeEventListener('click', this._detailCanvasHandler);
            this._detailCanvasHandler = null;
        }
        canvas.style.display = 'none';

        if (record.phoneTargetSnapshot) {
            // 有快照：直接展示靶纸实况截图（与实况100%一致）
            img.src = record.phoneTargetSnapshot;
            img.style.display = 'block';
            if (hint) hint.textContent = '靶纸实况快照';
        } else {
            // 无快照（旧记录）：回退到canvas绘制
            img.style.display = 'none';
            canvas.style.display = 'block';
            if (hint) hint.textContent = '点击靶纸可局部放大（圆靶）';
            const ctx = canvas.getContext('2d');
            const w = canvas.width, h = canvas.height;
            this._detailRecord = record;
            this._detailZoom = false;
            this._detailZoomArea = null;
            this._detailCanvasW = w;
            this._detailCanvasH = h;
            this._detailTargetImg = null;
            this._renderDetailCanvas(ctx, w, h, record, null);
            this._bindDetailCanvasClick();
        }
    },

    // 核心绘制函数（与 renderPhoneTarget 保持一致的映射逻辑）
    _renderDetailCanvas(ctx, w, h, record, zoomArea) {
        ctx.clearRect(0, 0, w, h);
        const cx = w / 2, cy = h / 2;
        const origCX = record.targetCX || 0;
        const origCY = record.targetCY || 0;
        const origR = record.targetRadius || 100;
        const typeId = record.targetTypeId || 0;

        if (this._detailTargetImg) {
            // === 图片靶纸：与 renderPhoneTarget 一致的映射逻辑 ===
            const img = this._detailTargetImg;
            const imgRatio = img.naturalWidth / img.naturalHeight;
            const canvasRatio = w / h;
            let drawW, drawH, drawX, drawY;

            if (imgRatio > canvasRatio) {
                drawW = w;
                drawH = w / imgRatio;
                drawX = 0;
                drawY = (h - drawH) / 2;
            } else {
                drawH = h;
                drawW = h * imgRatio;
                drawX = (w - drawW) / 2;
                drawY = 0;
            }

            ctx.drawImage(img, drawX, drawY, drawW, drawH);

            // 图片边框
            ctx.strokeStyle = 'rgba(0,240,255,0.2)';
            ctx.lineWidth = 1;
            ctx.strokeRect(drawX, drawY, drawW, drawH);

            // 用 phoneRadius / targetRadius 做缩放（与 renderPhoneTarget 完全一致）
            const phoneRadius = Math.min(drawW, drawH) * 0.4;
            const scale = phoneRadius / origR;

            // 绘制弹着点
            if (record.impacts && record.impacts.length > 0) {
                record.impacts.forEach((imp, idx) => {
                    const impX = cx + (imp.x - origCX) * scale;
                    const impY = cy + (imp.y - origCY) * scale;

                    // 弹孔
                    ctx.beginPath();
                    ctx.arc(impX, impY, 3, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255, 50, 50, 0.9)';
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(impX, impY, 5.5, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(255, 50, 50, 0.5)';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    // 编号标签
                    const label = String(idx + 1);
                    ctx.font = 'bold 9px Consolas, monospace';
                    ctx.textAlign = 'center';
                    const tm = ctx.measureText(label);
                    const pad = 2;
                    ctx.fillStyle = 'rgba(10, 10, 20, 0.80)';
                    ctx.fillRect(impX - tm.width / 2 - pad, impY - 18, tm.width + pad * 2, 11);
                    ctx.strokeStyle = 'rgba(255, 50, 50, 0.4)';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(impX - tm.width / 2 - pad, impY - 18, tm.width + pad * 2, 11);
                    ctx.fillStyle = '#ff6666';
                    ctx.fillText(label, impX, impY - 9);
                });
            }
        } else {
            // === 圆靶：程序绘制环区 + 弹着点 ===
            const maxRadius = Math.min(w, h) * 0.40;

            let scale, offsetX, offsetY;
            if (zoomArea) {
                const zoomFactor = 2.5;
                scale = (maxRadius / origR) * zoomFactor;
                offsetX = cx - zoomArea.px * scale;
                offsetY = cy - zoomArea.py * scale;
            } else {
                scale = maxRadius / origR;
                offsetX = cx;
                offsetY = cy;
            }

            const viewRadius = zoomArea ? maxRadius * 1.2 : maxRadius;
            this.drawDetailRings(ctx, cx, cy, viewRadius, typeId);

            // 十字线
            ctx.beginPath();
            ctx.moveTo(cx - viewRadius, cy);
            ctx.lineTo(cx + viewRadius, cy);
            ctx.moveTo(cx, cy - viewRadius);
            ctx.lineTo(cx, cy + viewRadius);
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // 靶心标记
            ctx.beginPath();
            ctx.arc(cx, cy, 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(200,50,50,0.8)';
            ctx.fill();

            // 绘制弹着点
            if (record.impacts && record.impacts.length > 0) {
                record.impacts.forEach((imp, idx) => {
                    const px = offsetX + (imp.x - origCX) * scale;
                    const py = offsetY + (imp.y - origCY) * scale;

                    if (px < -20 || px > w + 20 || py < -20 || py > h + 20) return;

                    ctx.beginPath();
                    ctx.arc(px, py, 3, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(200, 50, 50, 0.9)';
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(px, py, 5.5, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(200, 50, 50, 0.4)';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    const label = String(idx + 1);
                    ctx.font = 'bold 9px Consolas, monospace';
                    ctx.textAlign = 'center';
                    const tm = ctx.measureText(label);
                    const pad = 2;
                    ctx.fillStyle = 'rgba(10, 10, 20, 0.75)';
                    ctx.fillRect(px - tm.width / 2 - pad, py - 18, tm.width + pad * 2, 11);
                    ctx.strokeStyle = 'rgba(200, 50, 50, 0.3)';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(px - tm.width / 2 - pad, py - 18, tm.width + pad * 2, 11);
                    ctx.fillStyle = '#ff6666';
                    ctx.fillText(label, px, py - 9);
                });
            }

            // 放大模式下显示提示
            if (zoomArea) {
                ctx.save();
                ctx.font = '10px Consolas, monospace';
                ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
                ctx.textAlign = 'left';
                ctx.fillText('[ 放大视图 - 点击返回全景 ]', 8, 16);
                ctx.restore();
            }
        }
    },

    // 绑定canvas点击事件（局部放大，仅圆靶）
    _bindDetailCanvasClick() {
        const canvas = document.getElementById('detail-canvas');
        if (!canvas) return;

        if (this._detailCanvasHandler) {
            canvas.removeEventListener('click', this._detailCanvasHandler);
        }

        this._detailCanvasHandler = (e) => {
            // 只有圆靶才支持点击放大
            if (this._detailTargetImg) return;

            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const clickX = (e.clientX - rect.left) * scaleX;
            const clickY = (e.clientY - rect.top) * scaleY;

            if (this._detailZoom) {
                this._detailZoom = false;
                this._detailZoomArea = null;
                const ctx = canvas.getContext('2d');
                this._renderDetailCanvas(ctx, this._detailCanvasW, this._detailCanvasH, this._detailRecord, null);
            } else {
                this._detailZoom = true;
                this._detailZoomArea = { px: clickX, py: clickY };
                const ctx = canvas.getContext('2d');
                this._renderDetailCanvas(ctx, this._detailCanvasW, this._detailCanvasH, this._detailRecord, this._detailZoomArea);
            }
        };

        canvas.addEventListener('click', this._detailCanvasHandler);
    },

    // 绘制靶纸环区
    drawDetailRings(ctx, cx, cy, maxRadius, targetTypeId) {
        const typeIndex = targetTypeId || 0;
        const ringPairs = {
            0: [ // 精准圆靶 - 10环制
                { ratio: 1.00, color: '#fff' },  // 1环
                { ratio: 0.90, color: '#222' },  // 2环
                { ratio: 0.80, color: '#fff' },  // 3环
                { ratio: 0.70, color: '#222' },  // 4环
                { ratio: 0.60, color: '#fff' },  // 5环
                { ratio: 0.50, color: '#222' },  // 6环
                { ratio: 0.40, color: '#fff' },  // 7环
                { ratio: 0.30, color: '#222' },  // 8环
                { ratio: 0.20, color: '#fff' },  // 9环
                { ratio: 0.10, color: '#222' },  // 10环
                { ratio: 0.05, color: '#fff' },  // X环
            ],
            1: [ // IPSC
                { ratio: 1.00, color: '#222' },  // D区外圈
                { ratio: 0.75, color: '#c8a23c' }, // C区
                { ratio: 0.50, color: '#c8a23c' }, // B区
                { ratio: 0.25, color: '#c8a23c' }, // A区
            ],
            2: [ // IDPA
                { ratio: 1.00, color: '#222' },  // 外圈
                { ratio: 0.60, color: '#666' },  // -3区
                { ratio: 0.30, color: '#444' },  // -1区
                { ratio: 0.15, color: '#333' },  // -0区
            ],
            3: [ // 人形靶
                { ratio: 1.00, color: '#444' },
                { ratio: 0.75, color: '#555' },
                { ratio: 0.50, color: '#666' },
                { ratio: 0.25, color: '#777' },
                { ratio: 0.10, color: '#888' },
            ]
        };

        const rings = ringPairs[typeIndex] || ringPairs[0];
        // 从外到内绘制
        for (const ring of rings) {
            const r = maxRadius * ring.ratio;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = ring.color;
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
    },

    // 初始化历史记录控件
    initHistoryControls() {
        const closeBtn = document.getElementById('history-close');
        const searchBtn = document.getElementById('history-search-btn');
        const clearFilterBtn = document.getElementById('history-clear-filter');
        const clearAllBtn = document.getElementById('history-clear-all');
        const backBtn = document.getElementById('detail-back');

        if (closeBtn) closeBtn.addEventListener('click', () => this.closeHistory());
        if (backBtn) backBtn.addEventListener('click', () => this.closeDetail());

        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.renderHistoryList());
        }
        if (clearFilterBtn) {
            clearFilterBtn.addEventListener('click', () => {
                document.getElementById('history-filter-type').value = '';
                document.getElementById('history-filter-from').value = '';
                document.getElementById('history-filter-to').value = '';
                document.getElementById('history-filter-min').value = '';
                document.getElementById('history-filter-max').value = '';
                document.getElementById('history-search').value = '';
                this.renderHistoryList();
            });
        }
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                if (confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
                    History.clearAll();
                    this.renderHistoryList();
                }
            });
        }

        // 筛选控件 change 事件
        ['history-filter-type', 'history-filter-from', 'history-filter-to', 'history-filter-min', 'history-filter-max'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', () => this.renderHistoryList());
        });

        // Tab 切换
        const tabs = document.querySelectorAll('.history-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const target = tab.dataset.tab;
                document.getElementById('history-tab-list').classList.toggle('hidden', target !== 'list');
                document.getElementById('history-tab-analysis').classList.toggle('hidden', target !== 'analysis');
                if (target === 'analysis') this.renderAnalysis();
            });
        });
    },

    // 渲染顶部用户信息
    renderUserInfo() {
        const nameEl = document.getElementById('user-name');
        if (nameEl) {
            nameEl.textContent = Auth.getUserName();
        }
    },

    shareResult() {
        const summary = UI._lastSummary;
        if (!summary) {
            const canvas = document.getElementById('result-canvas');
            const link = document.createElement('a');
            link.download = this.buildCardFileName();
            link.href = canvas.toDataURL('image/png');
            link.click();
            this.showToast('战绩卡已保存');
            return;
        }

        // 构建包含所有分析的高分辨率战绩卡
        const cardW = 1080;
        const gap = 30;

        // 1. 主战绩卡
        const cardCanvas = document.createElement('canvas');
        cardCanvas.width = cardW;
        cardCanvas.height = 520;
        UI.renderResultCard(summary, cardCanvas);

        const out = document.createElement('canvas');
        out.width = cardW;
        out.height = 2000; // 临时高度，最后裁剪
        const ctx = out.getContext('2d');
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, cardW, 2000);

        ctx.drawImage(cardCanvas, 0, 0);

        let y = 520 + gap;

        // 2. 弹着点热力图
        const heatCanvas = document.getElementById('result-heatmap');
        if (heatCanvas) {
            ctx.fillStyle = '#0a0a0f';
            ctx.fillRect(40, y, cardW - 80, 200);
            ctx.strokeStyle = 'rgba(0,240,255,0.1)';
            ctx.lineWidth = 1;
            ctx.strokeRect(40, y, cardW - 80, 200);
            ctx.drawImage(heatCanvas, 40, y, cardW - 80, 200);
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '18px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('弹着点热力分布', cardW / 2, y - 8);
            y += 200 + gap;
        }

        // 3. 击发节奏分析
        const shots = Shooting.shots;
        if (shots.length >= 2) {
            const intervals = [];
            for (let i = 1; i < shots.length; i++) intervals.push(shots[i].time - shots[i - 1].time);
            const maxI = Math.max(...intervals);
            const avgI = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const stdDev = Math.sqrt(intervals.reduce((s, v) => s + (v - avgI) ** 2, 0) / intervals.length);
            const cv = avgI > 0 ? (stdDev / avgI * 100) : 0;
            const uniformity = cv < 15 ? '均匀' : cv < 30 ? '一般' : '不均匀';

            ctx.fillStyle = '#0a0a0f';
            ctx.fillRect(40, y, cardW - 80, 180);
            ctx.strokeStyle = 'rgba(0,240,255,0.1)';
            ctx.strokeRect(40, y, cardW - 80, 180);
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '18px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('击发节奏分析', cardW / 2, y - 8);

            const barW = Math.floor((cardW - 160) / intervals.length);
            intervals.forEach((interval, i) => {
                const bh = Math.max(10, (interval / maxI) * 80);
                const bx = 80 + i * (barW + 4);
                const by = y + 140 - bh;
                let color = 'rgba(0,240,255,0.6)';
                if (interval > avgI * 1.3) color = 'rgba(255,204,0,0.7)';
                else if (interval < avgI * 0.7) color = 'rgba(255,42,109,0.7)';
                ctx.fillStyle = color;
                ctx.fillRect(bx, by, barW, bh);
            });

            ctx.fillStyle = 'rgba(170,170,187,0.7)';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('平均 ' + (avgI / 1000).toFixed(2) + 's | 节奏: ' + uniformity + ' (CV ' + cv.toFixed(0) + '%)', cardW / 2, y + 160);
            y += 180 + gap;
        }

        // 4. 偏差分解
        const targetCX = App.targetCX || 0;
        const targetCY = App.targetCY || 0;
        if (shots.length > 0) {
            let sumH = 0, sumV = 0;
            for (const s of shots) { sumH += s.impactX - targetCX; sumV += s.impactY - targetCY; }
            const avgH = sumH / shots.length;
            const avgV = sumV / shots.length;

            ctx.fillStyle = '#0a0a0f';
            ctx.fillRect(40, y, cardW - 80, 160);
            ctx.strokeStyle = 'rgba(0,240,255,0.1)';
            ctx.strokeRect(40, y, cardW - 80, 160);
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '18px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('偏差分解', cardW / 2, y - 8);

            // 横向
            ctx.fillStyle = 'rgba(170,170,187,0.7)';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('横向 (风偏/扳机): ' + avgH.toFixed(1) + 'px', 80, y + 30);
            ctx.fillStyle = 'rgba(0,240,255,0.1)';
            ctx.fillRect(80, y + 42, 400, 14);
            ctx.fillStyle = 'rgba(0,240,255,0.4)';
            const hOff = Math.max(-200, Math.min(200, avgH * 10));
            ctx.fillRect(280 + hOff - 3, y + 42, 6, 14);

            // 纵向
            ctx.fillStyle = 'rgba(170,170,187,0.7)';
            ctx.font = '14px sans-serif';
            ctx.fillText('纵向 (呼吸/瞄准): ' + avgV.toFixed(1) + 'px', 80, y + 80);
            ctx.fillStyle = 'rgba(0,240,255,0.1)';
            ctx.fillRect(80, y + 92, 400, 14);
            ctx.fillStyle = 'rgba(0,240,255,0.4)';
            const vOff = Math.max(-200, Math.min(200, avgV * 10));
            ctx.fillRect(280 + vOff - 3, y + 92, 6, 14);

            ctx.fillStyle = 'rgba(170,170,187,0.5)';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('← 左偏                靶心                右偏 →', 280, y + 130);
            y += 160 + gap;
        }

        // 5. 铭晨APP下载二维码（图片最底部居中）
        this.drawQRCode(ctx, (cardW - 120) / 2, y + 20, 120);
        y += 180;

        // 裁剪到实际高度
        const finalH = y + 40;
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = cardW;
        finalCanvas.height = finalH;
        const fctx = finalCanvas.getContext('2d');
        fctx.drawImage(out, 0, 0);

        const link = document.createElement('a');
        link.download = this.buildCardFileName(summary);
        link.href = finalCanvas.toDataURL('image/png');
        link.click();
        this.showToast('战绩卡已保存');
    },

    drawQRCode(ctx, x, y, size) {
        // cell 必须整除，保证 21x21 网格恰好填满
        const cell = Math.floor(size / 21);
        const qrSize = cell * 21; // 实际二维码图案尺寸
        const margin = Math.floor((size - qrSize) / 2); // 白色背景内边距
        const qx = x + margin; // 二维码图案起始 x
        const qy = y + margin; // 二维码图案起始 y

        // 白色背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, size, size + 28);

        // 定位图案（三个角 7x7）
        const drawFinder = (fx, fy) => {
            ctx.fillStyle = '#0a0a0f';
            ctx.fillRect(qx + fx * cell, qy + fy * cell, 7 * cell, 7 * cell);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(qx + (fx + 1) * cell, qy + (fy + 1) * cell, 5 * cell, 5 * cell);
            ctx.fillStyle = '#0a0a0f';
            ctx.fillRect(qx + (fx + 2) * cell, qy + (fy + 2) * cell, 3 * cell, 3 * cell);
        };
        drawFinder(0, 0);      // 左上
        drawFinder(14, 0);     // 右上
        drawFinder(0, 14);     // 左下

        // 随机数据方块
        ctx.fillStyle = '#0a0a0f';
        for (let r = 0; r < 21; r++) {
            for (let c = 0; c < 21; c++) {
                // 跳过三个定位图案区域
                if ((r < 7 && c < 7) || (r < 7 && c >= 14) || (r >= 14 && c < 7)) continue;
                if (Math.random() > 0.45) {
                    ctx.fillRect(qx + c * cell, qy + r * cell, cell, cell);
                }
            }
        }

        // 文字
        ctx.fillStyle = 'rgba(170,170,187,0.8)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('扫码下载 铭晨APP', x + size / 2, y + size + 20);
    },

    buildCardFileName(summary) {
        const now = new Date();
        const dateStr = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
        if (!summary) return 'MINGCHEN_' + dateStr + '.png';
        const grade = summary.grade || 'X';
        const score = typeof summary.totalScore === 'number' ? summary.totalScore.toFixed(0) : summary.totalScore;
        return 'MINGCHEN_' + dateStr + '_' + grade + '_' + score + '分.png';
    },

    showToast(message) {
        let toast = document.getElementById('app-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'app-toast';
            toast.style.cssText = 'position:fixed;bottom:40px;left:50%;transform:translateX(-50%);background:rgba(0,240,255,0.12);border:1px solid rgba(0,240,255,0.3);color:var(--cyan);padding:10px 24px;border-radius:6px;font-size:13px;z-index:9999;opacity:0;transition:opacity 0.3s;pointer-events:none;backdrop-filter:blur(4px);';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.opacity = '1';
        setTimeout(() => { toast.style.opacity = '0'; }, 2000);
    },

    showConfirmInput(message) {
        return new Promise((resolve) => {
            const existing = document.getElementById('app-confirm-input');
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.id = 'app-confirm-input';
            overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(5,5,10,0.85);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';

            const box = document.createElement('div');
            box.style.cssText = 'background:#0f0f1a;border:1px solid rgba(0,240,255,0.2);border-radius:8px;padding:20px;width:300px;text-align:center;';

            const msg = document.createElement('div');
            msg.textContent = message;
            msg.style.cssText = 'color:var(--text-primary);font-size:13px;margin-bottom:14px;line-height:1.5;';

            const input = document.createElement('input');
            input.type = 'text';
            input.style.cssText = 'width:100%;padding:8px 10px;background:rgba(0,240,255,0.05);border:1px solid rgba(0,240,255,0.15);border-radius:4px;color:var(--text-primary);font-size:13px;outline:none;margin-bottom:14px;box-sizing:border-box;';

            const btns = document.createElement('div');
            btns.style.cssText = 'display:flex;gap:8px;justify-content:center;';

            const btnOk = document.createElement('button');
            btnOk.textContent = '确认';
            btnOk.style.cssText = 'flex:1;padding:8px;background:rgba(0,240,255,0.1);border:1px solid rgba(0,240,255,0.2);border-radius:4px;color:var(--cyan);font-size:12px;cursor:pointer;';

            const btnCancel = document.createElement('button');
            btnCancel.textContent = '取消';
            btnCancel.style.cssText = 'flex:1;padding:8px;background:transparent;border:1px solid rgba(170,170,187,0.2);border-radius:4px;color:var(--text-dim);font-size:12px;cursor:pointer;';

            const cleanup = () => { overlay.remove(); };

            btnOk.addEventListener('click', () => { cleanup(); resolve(input.value); });
            btnCancel.addEventListener('click', () => { cleanup(); resolve(null); });
            overlay.addEventListener('click', (e) => { if (e.target === overlay) { cleanup(); resolve(null); } });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { cleanup(); resolve(input.value); }
                else if (e.key === 'Escape') { cleanup(); resolve(null); }
            });

            btns.appendChild(btnCancel);
            btns.appendChild(btnOk);
            box.appendChild(msg);
            box.appendChild(input);
            box.appendChild(btns);
            overlay.appendChild(box);
            document.body.appendChild(overlay);
            input.focus();
        });
    },

    // ========== 分享面板 ==========
    openSharePanel() {
        const overlay = document.getElementById('share-overlay');
        if (overlay) overlay.classList.remove('hidden');
        this.initSharePanel();
    },

    closeSharePanel() {
        const overlay = document.getElementById('share-overlay');
        if (overlay) overlay.classList.add('hidden');
    },

    initSharePanel() {
        const cancelBtn = document.getElementById('share-cancel');
        if (cancelBtn) {
            cancelBtn.onclick = () => this.closeSharePanel();
        }

        const options = document.querySelectorAll('.share-option');
        options.forEach(opt => {
            opt.onclick = () => {
                const type = opt.dataset.type;
                const labels = {
                    'wechat-friend': '微信好友',
                    'wechat-moment': '朋友圈',
                    'album': '保存相册',
                    'copy-link': '复制链接'
                };
                console.log('[分享]' + labels[type] + ' - 功能开发中');
                // 功能占位，后续接入微信SDK等
            };
        });

        // 点击遮罩关闭
        const overlay = document.getElementById('share-overlay');
        if (overlay) {
            overlay.onclick = (e) => {
                if (e.target === overlay) this.closeSharePanel();
            };
        }
    },

    // ========== 设置面板 ==========
    openSettings() {
        this.playUISound();
        const overlay = document.getElementById('settings-overlay');
        if (overlay) overlay.classList.remove('hidden');
        this.syncSettingsUI();
    },

    closeSettings() {
        this.playUISound();
        const overlay = document.getElementById('settings-overlay');
        if (overlay) overlay.classList.add('hidden');
    },

    syncSettingsUI() {
        const els = {
            soundShot: document.getElementById('setting-sound-shot'),
            soundUI: document.getElementById('setting-sound-ui'),
            vibrate: document.getElementById('setting-vibrate')
        };
        if (els.soundShot) els.soundShot.checked = Settings.get('soundShot');
        if (els.soundUI) els.soundUI.checked = Settings.get('soundUI');
        if (els.vibrate) els.vibrate.checked = Settings.get('vibrate');
    },

    initSettingsControls() {
        const overlay = document.getElementById('settings-overlay');
        if (overlay) {
            overlay.onclick = (e) => {
                if (e.target === overlay) this.closeSettings();
            };
        }

        const bindToggle = (id, key) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', (e) => {
                    Settings.set(key, e.target.checked);
                    Settings.playUISound();
                });
            }
        };
        bindToggle('setting-sound-shot', 'soundShot');
        bindToggle('setting-sound-ui', 'soundUI');
        bindToggle('setting-vibrate', 'vibrate');

        // 关于面板
        const btnAbout = document.getElementById('btn-about');
        if (btnAbout) btnAbout.addEventListener('click', () => this.openAbout());
        const btnAboutClose = document.getElementById('about-close');
        if (btnAboutClose) btnAboutClose.addEventListener('click', () => this.closeAbout());
        const aboutOverlay = document.getElementById('about-overlay');
        if (aboutOverlay) {
            aboutOverlay.onclick = (e) => {
                if (e.target === aboutOverlay) this.closeAbout();
            };
        }

        // 隐私政策（暂无功能）
        const btnPrivacy = document.getElementById('btn-privacy');
        if (btnPrivacy) {
            btnPrivacy.addEventListener('click', () => {
                console.log('[关于] 隐私政策 - 功能开发中');
            });
        }

        // 用户协议（暂无功能）
        const btnTerms = document.getElementById('btn-terms');
        if (btnTerms) {
            btnTerms.addEventListener('click', () => {
                console.log('[关于] 用户协议 - 功能开发中');
            });
        }

        // 开源组件
        const btnOpensource = document.getElementById('btn-opensource');
        if (btnOpensource) btnOpensource.addEventListener('click', () => this.openOpensource());
        const btnOpensourceClose = document.getElementById('opensource-close');
        if (btnOpensourceClose) btnOpensourceClose.addEventListener('click', () => this.closeOpensource());
        const opensourceOverlay = document.getElementById('opensource-overlay');
        if (opensourceOverlay) {
            opensourceOverlay.onclick = (e) => {
                if (e.target === opensourceOverlay) this.closeOpensource();
            };
        }

        // 摄像头设置
        const btnCamera = document.getElementById('btn-camera');
        if (btnCamera) btnCamera.addEventListener('click', () => this.openCamera());
        const btnCameraClose = document.getElementById('camera-close');
        if (btnCameraClose) btnCameraClose.addEventListener('click', () => this.closeCamera());
        const cameraOverlay = document.getElementById('camera-overlay');
        if (cameraOverlay) {
            cameraOverlay.onclick = (e) => {
                if (e.target === cameraOverlay) this.closeCamera();
            };
        }
        const btnCameraFront = document.getElementById('btn-camera-front');
        if (btnCameraFront) {
            btnCameraFront.addEventListener('click', () => {
                console.log('[摄像头] 切换到前置摄像头 - 功能开发中');
            });
        }
        const btnCameraBack = document.getElementById('btn-camera-back');
        if (btnCameraBack) {
            btnCameraBack.addEventListener('click', () => {
                console.log('[摄像头] 切换到后置摄像头 - 功能开发中');
            });
        }

        // 激光检测调优面板
        const btnLaser = document.getElementById('btn-laser');
        if (btnLaser) btnLaser.addEventListener('click', () => this.openLaser());
        const btnLaserClose = document.getElementById('laser-close');
        if (btnLaserClose) btnLaserClose.addEventListener('click', () => this.closeLaser());
        const laserOverlay = document.getElementById('laser-overlay');
        if (laserOverlay) {
            laserOverlay.onclick = (e) => {
                if (e.target === laserOverlay) this.closeLaser();
            };
        }

        // HSV 滑块值更新显示
        const bindLaserSlider = (minId, maxId, valId) => {
            const minEl = document.getElementById(minId);
            const maxEl = document.getElementById(maxId);
            const valEl = document.getElementById(valId);
            if (!minEl || !maxEl || !valEl) return;
            const update = () => {
                let min = parseInt(minEl.value);
                let max = parseInt(maxEl.value);
                if (min > max) { const t = min; min = max; max = t; }
                valEl.textContent = min + ' - ' + max;
            };
            minEl.addEventListener('input', update);
            maxEl.addEventListener('input', update);
        };
        bindLaserSlider('laser-hue-min', 'laser-hue-max', 'laser-hue-val');
        bindLaserSlider('laser-sat-min', 'laser-sat-max', 'laser-sat-val');
        bindLaserSlider('laser-val-min', 'laser-val-max', 'laser-val-val');

        // 激光颜色选择
        const laserColorInputs = document.querySelectorAll('input[name="laser-color"]');
        laserColorInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                console.log('[激光检测] 激光颜色切换为:', e.target.value);
            });
        });

        // 环境光校准
        const btnLaserCalib = document.getElementById('btn-laser-calib');
        if (btnLaserCalib) {
            btnLaserCalib.addEventListener('click', () => {
                console.log('[激光检测] 开始环境光扫描 - 功能开发中');
            });
        }

        // 检测灵敏度
        const sensHints = {
            low: '适应强光环境，降低误检率',
            mid: '适应一般室内光照条件',
            high: '适应弱光环境，提高检测精度'
        };
        const sensInputs = document.querySelectorAll('input[name="laser-sens"]');
        sensInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const hintEl = document.getElementById('laser-sens-hint');
                if (hintEl) hintEl.textContent = sensHints[e.target.value];
                console.log('[激光检测] 灵敏度切换为:', e.target.value);
            });
        });

        // 检测性能实时显示（模拟）
        this._laserPerfTimer = setInterval(() => {
            const fpsEl = document.getElementById('laser-perf-fps');
            const latEl = document.getElementById('laser-perf-latency');
            const cpuEl = document.getElementById('laser-perf-cpu');
            if (fpsEl) fpsEl.textContent = Math.round(28 + Math.random() * 12);
            if (latEl) latEl.textContent = Math.round(12 + Math.random() * 18);
            if (cpuEl) cpuEl.textContent = Math.round(15 + Math.random() * 25);
        }, 1000);

        // 战绩卡主题
        const btnCardTheme = document.getElementById('btn-card-theme');
        if (btnCardTheme) btnCardTheme.addEventListener('click', () => this.openCardTheme());
        const btnCardThemeClose = document.getElementById('card-theme-close');
        if (btnCardThemeClose) btnCardThemeClose.addEventListener('click', () => this.closeCardTheme());
        const cardThemeOverlay = document.getElementById('card-theme-overlay');
        if (cardThemeOverlay) {
            cardThemeOverlay.onclick = (e) => {
                if (e.target === cardThemeOverlay) this.closeCardTheme();
            };
        }
        // 主题选择
        const themeInputs = document.querySelectorAll('input[name="card-theme"]');
        themeInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const themeKey = e.target.value;
                Settings.data.cardTheme = themeKey;
                Settings.save();
                const themeLabel = document.getElementById('card-theme-label');
                if (themeLabel) themeLabel.textContent = Settings.cardThemes[themeKey].name;
                console.log('[战绩卡主题] 切换为:', Settings.cardThemes[themeKey].name);
            });
        });
        // 同步当前主题到设置面板
        const currentTheme = Settings.data.cardTheme || 'cyan';
        const themeLabel = document.getElementById('card-theme-label');
        if (themeLabel) themeLabel.textContent = Settings.cardThemes[currentTheme].name;
        themeInputs.forEach(input => {
            input.checked = (input.value === currentTheme);
        });

        // 数据同步
        const btnSync = document.getElementById('btn-sync');
        if (btnSync) {
            btnSync.addEventListener('click', async () => {
                if (typeof Sync === 'undefined') {
                    this.showToast('同步模块未加载');
                    return;
                }
                const dot = document.querySelector('#sync-status .sync-dot');
                const label = document.querySelector('#sync-status span:last-child');
                if (dot) dot.className = 'sync-dot sync-syncing';
                if (label) label.textContent = '同步中...';
                try {
                    const result = await Sync.sync();
                    this.showToast(result && result.message ? result.message : '同步完成');
                    if (dot) dot.className = 'sync-dot sync-online';
                    if (label) label.textContent = '在线';
                } catch (err) {
                    console.error('[同步]', err);
                    this.showToast('同步失败: ' + (err.message || '未知错误'));
                    if (dot) dot.className = 'sync-dot sync-online';
                    if (label) label.textContent = '在线';
                }
            });
        }
        const btnManualSync = document.getElementById('btn-manual-sync');
        if (btnManualSync) btnManualSync.addEventListener('click', () => Sync.sync());
        const autoSyncInput = document.getElementById('setting-auto-sync');
        if (autoSyncInput) {
            autoSyncInput.checked = Sync.autoSync;
            autoSyncInput.addEventListener('change', (e) => {
                Sync.autoSync = e.target.checked;
                Sync.saveState();
            });
        }

        // 主题与外观
        this.initThemeControls();

        // 帮助与反馈
        const btnHelpCenter = document.getElementById('btn-help-center');
        if (btnHelpCenter) btnHelpCenter.addEventListener('click', () => this.openHelp('center'));
        const helpCenterClose = document.getElementById('help-center-close');
        if (helpCenterClose) helpCenterClose.addEventListener('click', () => this.closeHelp('center'));
        const helpCenterOverlay = document.getElementById('help-center-overlay');
        if (helpCenterOverlay) helpCenterOverlay.onclick = (e) => { if (e.target === helpCenterOverlay) this.closeHelp('center'); };

        // 帮助中心子入口
        const centerMap = { 'tutorial': 'btn-center-tutorial', 'guns': 'btn-center-guns', 'faq': 'btn-center-faq', 'feedback': 'btn-center-feedback' };
        Object.entries(centerMap).forEach(([id, btnId]) => {
            const btn = document.getElementById(btnId);
            if (btn) btn.addEventListener('click', () => {
                this.closeHelp('center');
                setTimeout(() => this.openHelp(id), 250);
            });
        });

        // 帮助面板关闭按钮
        ['tutorial', 'guns', 'faq', 'feedback'].forEach(id => {
            const close = document.getElementById('help-' + id + '-close');
            const overlay = document.getElementById('help-' + id + '-overlay');
            if (close) close.addEventListener('click', () => this.closeHelp(id));
            if (overlay) overlay.onclick = (e) => { if (e.target === overlay) this.closeHelp(id); };
        });

        // 检查更新
        const btnHelpUpdate = document.getElementById('btn-help-update');
        if (btnHelpUpdate) {
            btnHelpUpdate.addEventListener('click', () => this.checkUpdate());
        }

        // 反馈表单提交
        const btnFeedbackSubmit = document.getElementById('btn-feedback-submit');
        if (btnFeedbackSubmit) {
            btnFeedbackSubmit.addEventListener('click', () => this.submitFeedback());
        }

        // 激光训练枪购买链接
        const gunLinks = document.querySelectorAll('.help-gun-link');
        gunLinks.forEach(link => {
            link.addEventListener('click', () => {
                const url = link.dataset.link;
                if (url) window.open(url, '_blank');
            });
        });

        // 靶纸校准面板
        const btnTargetCalib = document.getElementById('btn-target-calib');
        if (btnTargetCalib) btnTargetCalib.addEventListener('click', () => this.openTargetCalib());
        const btnTargetCalibClose = document.getElementById('target-calib-close');
        if (btnTargetCalibClose) btnTargetCalibClose.addEventListener('click', () => this.closeTargetCalib());
        const targetCalibOverlay = document.getElementById('target-calib-overlay');
        if (targetCalibOverlay) {
            targetCalibOverlay.onclick = (e) => {
                if (e.target === targetCalibOverlay) this.closeTargetCalib();
            };
        }

        // 校准按钮
        const btnStartCalib = document.getElementById('btn-start-calib');
        if (btnStartCalib) {
            btnStartCalib.addEventListener('click', async () => {
                btnStartCalib.textContent = '校准中...';
                btnStartCalib.disabled = true;
                const result = await TargetCalib.calibrate();
                // 显示结果
                const gradeEl = document.getElementById('calib-quality-grade');
                const hintEl = document.getElementById('calib-quality-hint');
                const paramsEl = document.getElementById('calib-params');
                if (gradeEl) {
                    gradeEl.textContent = result.quality;
                    gradeEl.className = 'calib-quality-grade ' + result.qualityClass;
                }
                if (hintEl) hintEl.textContent = result.hint;
                if (paramsEl) {
                    paramsEl.style.display = 'block';
                    document.getElementById('calib-offset-x').textContent = result.offsetX;
                    document.getElementById('calib-offset-y').textContent = result.offsetY;
                    document.getElementById('calib-scale').textContent = result.scale;
                    document.getElementById('calib-angle').textContent = result.angle + '\u00b0';
                }
                // 切换按钮
                btnStartCalib.style.display = 'none';
                document.getElementById('btn-retry-calib').style.display = 'block';
                document.getElementById('btn-save-calib').style.display = 'block';
                TargetCalib.updateStatusLabel();
            });
        }
        const btnRetryCalib = document.getElementById('btn-retry-calib');
        if (btnRetryCalib) {
            btnRetryCalib.addEventListener('click', async () => {
                btnRetryCalib.textContent = '校准中...';
                btnRetryCalib.disabled = true;
                const result = await TargetCalib.calibrate();
                const gradeEl = document.getElementById('calib-quality-grade');
                const hintEl = document.getElementById('calib-quality-hint');
                if (gradeEl) {
                    gradeEl.textContent = result.quality;
                    gradeEl.className = 'calib-quality-grade ' + result.qualityClass;
                }
                if (hintEl) hintEl.textContent = result.hint;
                document.getElementById('calib-offset-x').textContent = result.offsetX;
                document.getElementById('calib-offset-y').textContent = result.offsetY;
                document.getElementById('calib-scale').textContent = result.scale;
                document.getElementById('calib-angle').textContent = result.angle + '\u00b0';
                btnRetryCalib.textContent = '重新校准';
                btnRetryCalib.disabled = false;
                TargetCalib.updateStatusLabel();
            });
        }
        const btnSaveCalib = document.getElementById('btn-save-calib');
        if (btnSaveCalib) {
            btnSaveCalib.addEventListener('click', () => {
                if (TargetCalib.currentCalib) {
                    TargetCalib.saveCalib({ ...TargetCalib.currentCalib });
                    btnSaveCalib.textContent = '已保存';
                    setTimeout(() => { btnSaveCalib.textContent = '保存校准'; }, 2000);
                }
            });
        }

        // 用户信息面板
        const btnProfileClose = document.getElementById('user-profile-close');
        if (btnProfileClose) btnProfileClose.addEventListener('click', () => this.closeUserProfile());
        const profileOverlay = document.getElementById('user-profile-overlay');
        if (profileOverlay) {
            profileOverlay.onclick = (e) => {
                if (e.target === profileOverlay) this.closeUserProfile();
            };
        }
        const profileBtnStats = document.getElementById('profile-btn-stats');
        if (profileBtnStats) {
            profileBtnStats.addEventListener('click', () => {
                this.closeUserProfile();
                this.openStats();
            });
        }
        const profileBtnHistory = document.getElementById('profile-btn-history');
        if (profileBtnHistory) {
            profileBtnHistory.addEventListener('click', () => {
                this.closeUserProfile();
                this.openHistory();
            });
        }
        const profileBtnLogout = document.getElementById('profile-btn-logout');
        if (profileBtnLogout) {
            profileBtnLogout.addEventListener('click', () => {
                if (confirm('确定要退出登录吗？')) {
                    Auth.logout();
                    location.reload();
                }
            });
        }

        // 账户管理面板
        const profileBtnAccount = document.getElementById('profile-btn-account');
        if (profileBtnAccount) {
            profileBtnAccount.addEventListener('click', () => {
                this.closeUserProfile();
                this.openAccount();
            });
        }
        const btnAccountClose = document.getElementById('account-close');
        if (btnAccountClose) btnAccountClose.addEventListener('click', () => this.closeAccount());
        const accountOverlay = document.getElementById('account-overlay');
        if (accountOverlay) {
            accountOverlay.onclick = (e) => {
                if (e.target === accountOverlay) this.closeAccount();
            };
        }

        // 头像上传
        const btnChangeAvatar = document.getElementById('btn-change-avatar');
        const avatarInput = document.getElementById('account-avatar-input');
        if (btnChangeAvatar && avatarInput) {
            btnChangeAvatar.addEventListener('click', () => avatarInput.click());
            avatarInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const dataUrl = ev.target.result;
                    localStorage.setItem('mingchen_avatar', dataUrl);
                    this.updateAccountAvatar();
                    this.showToast('头像已更新');
                };
                reader.readAsDataURL(file);
            });
        }

        // 昵称保存
        const btnSaveNickname = document.getElementById('btn-save-nickname');
        const inputNickname = document.getElementById('account-nickname');
        if (btnSaveNickname && inputNickname) {
            btnSaveNickname.addEventListener('click', () => {
                const name = inputNickname.value.trim();
                if (!name) return;
                localStorage.setItem('mingchen_nickname', name);
                document.getElementById('user-name').textContent = name;
                document.getElementById('profile-name').textContent = name;
                this.showToast('昵称已保存');
            });
        }

        // 手机号绑定
        const btnBindPhone = document.getElementById('btn-bind-phone');
        const inputPhone = document.getElementById('account-phone');
        if (btnBindPhone && inputPhone) {
            btnBindPhone.addEventListener('click', () => {
                const phone = inputPhone.value.trim();
                if (!/^1\d{10}$/.test(phone)) {
                    alert('请输入正确的11位手机号');
                    return;
                }
                localStorage.setItem('mingchen_phone', phone);
                const statusEl = document.getElementById('account-phone-status');
                if (statusEl) statusEl.textContent = '已绑定: ' + phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
                this.showToast('手机号已绑定');
            });
        }

        // 数据同步
        const btnSyncNow = document.getElementById('btn-sync-now');
        if (btnSyncNow) {
            btnSyncNow.addEventListener('click', async () => {
                if (typeof Sync === 'undefined') {
                    this.showToast('同步模块未加载');
                    return;
                }
                btnSyncNow.textContent = '同步中...';
                btnSyncNow.disabled = true;
                try {
                    const result = await Sync.sync();
                    btnSyncNow.textContent = '立即同步';
                    btnSyncNow.disabled = false;
                    this.showToast(result && result.message ? result.message : '同步完成');
                    this.updateSyncUI();
                } catch (err) {
                    btnSyncNow.textContent = '立即同步';
                    btnSyncNow.disabled = false;
                    console.error('[同步]', err);
                    this.showToast('同步失败: ' + (err.message || '未知错误'));
                }
            });
        }

        // 账户注销
        const btnDeleteAccount = document.getElementById('btn-delete-account');
        if (btnDeleteAccount) {
            btnDeleteAccount.addEventListener('click', async (e) => {
                e.stopPropagation();
                const input = await this.showConfirmInput('警告：此操作将永久删除所有本地数据（训练记录、设置等），不可恢复。请输入 "注销" 以确认操作：');
                if (input !== '注销') {
                    if (input !== null) this.showToast('操作已取消');
                    return;
                }
                try {
                    const keys = Object.keys(localStorage).filter(k => k.startsWith('mingchen_'));
                    keys.forEach(k => localStorage.removeItem(k));
                    if (typeof Auth !== 'undefined' && Auth.logout) Auth.logout();
                    this.showToast('账户已注销');
                    setTimeout(() => location.reload(), 1500);
                } catch (err) {
                    console.error('[注销账户]', err);
                    alert('操作失败: ' + (err.message || '未知错误'));
                }
            });
        }

        // 数据统计面板关闭
        const btnStatsClose = document.getElementById('stats-close');
        if (btnStatsClose) btnStatsClose.addEventListener('click', () => this.closeStats());
        const statsOverlay = document.getElementById('stats-overlay');
        if (statsOverlay) {
            statsOverlay.onclick = (e) => {
                if (e.target === statsOverlay) this.closeStats();
            };
        }
        // 时间范围切换
        const statTabs = document.querySelectorAll('.stats-tab');
        statTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                statTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderStats(tab.dataset.range);
            });
        });
    },

    // ========== 关于面板 ==========
    openAbout() {
        const overlay = document.getElementById('about-overlay');
        if (overlay) overlay.classList.remove('hidden');
    },

    closeAbout() {
        const overlay = document.getElementById('about-overlay');
        if (overlay) overlay.classList.add('hidden');
    },

    // ========== 开源组件面板 ==========
    openOpensource() {
        const overlay = document.getElementById('opensource-overlay');
        if (overlay) overlay.classList.remove('hidden');
    },

    closeOpensource() {
        const overlay = document.getElementById('opensource-overlay');
        if (overlay) overlay.classList.add('hidden');
    },

    // ========== 摄像头设置面板 ==========
    openCamera() {
        const overlay = document.getElementById('camera-overlay');
        if (overlay) overlay.classList.remove('hidden');
    },

    closeCamera() {
        const overlay = document.getElementById('camera-overlay');
        if (overlay) overlay.classList.add('hidden');
    },

    // ========== 激光检测调优面板 ==========
    openLaser() {
        const overlay = document.getElementById('laser-overlay');
        if (overlay) overlay.classList.remove('hidden');
    },

    closeLaser() {
        const overlay = document.getElementById('laser-overlay');
        if (overlay) overlay.classList.add('hidden');
    },

    // ========== 战绩卡主题面板 ==========
    openCardTheme() {
        const overlay = document.getElementById('card-theme-overlay');
        if (overlay) overlay.classList.remove('hidden');
    },

    closeCardTheme() {
        const overlay = document.getElementById('card-theme-overlay');
        if (overlay) overlay.classList.add('hidden');
    },

    // ========== 靶纸校准面板 ==========
    openTargetCalib() {
        const overlay = document.getElementById('target-calib-overlay');
        if (overlay) overlay.classList.remove('hidden');
        TargetCalib.updateUI();
    },

    closeTargetCalib() {
        const overlay = document.getElementById('target-calib-overlay');
        if (overlay) overlay.classList.add('hidden');
    },

    // ========== 用户信息面板 ==========
    openUserProfile() {
        this.playUISound();
        const overlay = document.getElementById('user-profile-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            // 更新用户信息
            const nameEl = document.getElementById('profile-name');
            const idEl = document.getElementById('profile-id');
            if (nameEl) nameEl.textContent = Auth.getUserName();
            if (idEl) idEl.textContent = 'ID: ' + (Auth.getUserId() || 'default');

            // 更新统计概览
            const all = History.getAll();
            const sessionsEl = document.getElementById('profile-sessions');
            const shotsEl = document.getElementById('profile-total-shots');
            const avgEl = document.getElementById('profile-avg-score');

            if (sessionsEl) sessionsEl.textContent = all.length;
            if (shotsEl) {
                const totalShots = all.reduce((s, r) => s + (r.summary?.shotCount || 0), 0);
                shotsEl.textContent = totalShots;
            }
            if (avgEl && all.length > 0) {
                const total = all.reduce((s, r) => s + (r.summary?.totalScore || 0), 0);
                avgEl.textContent = (total / all.length).toFixed(0);
            }

            // 渲染打卡和里程碑
            this.renderCheckin(all);
            this.renderMilestones(all);
        }
    },

    closeUserProfile() {
        this.playUISound();
        const overlay = document.getElementById('user-profile-overlay');
        if (overlay) overlay.classList.add('hidden');
    },

    // 渲染连续训练打卡
    renderCheckin(records) {
        const streakEl = document.getElementById('checkin-streak');
        const daysEl = document.getElementById('checkin-days');
        const hintEl = document.getElementById('checkin-hint');
        if (!streakEl || !daysEl) return;

        const checkin = this._getCheckinData();
        streakEl.textContent = checkin.streak + ' 天';

        // 渲染最近7天
        const today = new Date();
        daysEl.innerHTML = '';
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const isActive = checkin.dates.includes(dateStr);
            const isToday = i === 0;
            const dayEl = document.createElement('div');
            dayEl.className = 'checkin-day' + (isActive ? ' active' : '') + (isToday ? ' today' : '');
            dayEl.textContent = d.getDate();
            dayEl.title = dateStr;
            daysEl.appendChild(dayEl);
        }

        if (hintEl) {
            const todayStr = today.toISOString().split('T')[0];
            hintEl.textContent = checkin.dates.includes(todayStr) ? '今日已打卡' : '今日未打卡，开始训练即可打卡';
        }
    },

    _getCheckinData() {
        const raw = localStorage.getItem('mingchen_checkin');
        if (raw) {
            try { return JSON.parse(raw); } catch (e) {}
        }
        return { streak: 0, dates: [] };
    },

    _saveCheckinData(data) {
        localStorage.setItem('mingchen_checkin', JSON.stringify(data));
    },

    updateCheckin() {
        const today = new Date().toISOString().split('T')[0];
        const data = this._getCheckinData();
        if (data.dates.includes(today)) return; // 已打卡

        data.dates.push(today);
        // 计算连续天数
        const sorted = [...data.dates].sort();
        let streak = 0;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (data.dates.includes(today)) {
            streak = 1;
            let d = new Date();
            d.setDate(d.getDate() - 1);
            while (data.dates.includes(d.toISOString().split('T')[0])) {
                streak++;
                d.setDate(d.getDate() - 1);
            }
        }
        data.streak = streak;
        // 只保留最近30天
        data.dates = data.dates.filter(d => {
            const diff = (new Date() - new Date(d)) / (1000 * 60 * 60 * 24);
            return diff < 30;
        });
        this._saveCheckinData(data);
    },

    // 渲染训练里程碑
    renderMilestones(records) {
        const listEl = document.getElementById('milestones-list');
        if (!listEl) return;

        const totalShots = records.reduce((s, r) => s + (r.summary?.shotCount || 0), 0);
        const totalSessions = records.length;
        const milestones = [
            { id: 'shots-100', name: '初出茅庐', desc: '累计射击 100 发', icon: '&#127775;', condition: totalShots >= 100 },
            { id: 'shots-500', name: '百步穿杨', desc: '累计射击 500 发', icon: '&#127775;&#127775;', condition: totalShots >= 500 },
            { id: 'shots-1000', name: '千发百中', desc: '累计射击 1000 发', icon: '&#127775;&#127775;&#127775;', condition: totalShots >= 1000 },
            { id: 'sessions-10', name: '持之以恒', desc: '累计训练 10 次', icon: '&#128170;', condition: totalSessions >= 10 },
            { id: 'sessions-50', name: '训练达人', desc: '累计训练 50 次', icon: '&#128170;&#128170;', condition: totalSessions >= 50 },
            { id: 'streak-7', name: '一周坚持', desc: '连续训练打卡 7 天', icon: '&#128293;', condition: this._getCheckinData().streak >= 7 },
            { id: 'streak-30', name: '月度冠军', desc: '连续训练打卡 30 天', icon: '&#128293;&#128293;', condition: this._getCheckinData().streak >= 30 },
        ];

        listEl.innerHTML = milestones.map(m => {
            const cls = m.condition ? 'unlocked' : 'locked';
            return '<div class="milestone-item ' + cls + '"><div class="milestone-icon">' + m.icon + '</div><div class="milestone-info"><div class="milestone-name">' + m.name + '</div><div class="milestone-desc">' + m.desc + '</div></div></div>';
        }).join('');
    },

    // ========== 数据统计面板 ==========
    openStats() {
        const overlay = document.getElementById('stats-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            this.renderStats('week');
        }
    },

    closeStats() {
        const overlay = document.getElementById('stats-overlay');
        if (overlay) overlay.classList.add('hidden');
    },

    renderStats(range) {
        const all = History.getAll();
        if (all.length === 0) {
            document.getElementById('stats-total-sessions').textContent = '0';
            document.getElementById('stats-avg-score').textContent = '0';
            document.getElementById('stats-best-score').textContent = '0';
            document.getElementById('stats-improvement').textContent = '--';
            return;
        }

        const now = Date.now();
        const ranges = { week: 7 * 86400000, month: 30 * 86400000, year: 365 * 86400000 };
        const cutoff = now - (ranges[range] || ranges.week);

        // 筛选并按时序排序（旧→新）
        let filtered = all.filter(r => new Date(r.date).getTime() > cutoff);
        filtered = filtered.slice().reverse();

        if (filtered.length === 0) filtered = all.slice().reverse();

        // 概览数据
        const totalScore = filtered.reduce((s, r) => s + (r.summary?.totalScore || 0), 0);
        const avgScore = filtered.length > 0 ? (totalScore / filtered.length).toFixed(0) : 0;
        const best = Math.max(...filtered.map(r => r.summary?.totalScore || 0));
        const first = filtered[0]?.summary?.totalScore || 0;
        const last = filtered[filtered.length - 1]?.summary?.totalScore || 0;
        const improvement = first > 0 ? (((last - first) / first) * 100).toFixed(0) + '%' : '--';

        document.getElementById('stats-total-sessions').textContent = filtered.length;
        document.getElementById('stats-avg-score').textContent = avgScore;
        document.getElementById('stats-best-score').textContent = best;
        document.getElementById('stats-improvement').textContent = improvement;

        // 训练频率统计
        this.renderFreqStats(all);

        // 最佳成绩
        const bestTotal = Math.max(...all.map(r => r.summary?.totalScore || 0));
        const bestSingle = Math.max(...all.map(r => r.summary?.bestShot || 0));
        const bestSpreadArr = all.map(r => parseFloat(r.summary?.spread) || Infinity);
        const bestSpread = Math.min(...bestSpreadArr);
        const bestStreak = Math.max(...all.map(r => r.summary?.bestStreak || 0));

        document.getElementById('best-total').textContent = bestTotal;
        document.getElementById('best-single').textContent = bestSingle.toFixed(1);
        document.getElementById('best-spread').textContent = bestSpread === Infinity ? '--' : bestSpread.toFixed(1);
        document.getElementById('best-streak').textContent = bestStreak;

        // 绘制趋势图
        this.drawLineChart('stats-chart-total', filtered, 'totalScore', '总分');
        this.drawLineChart('stats-chart-avg', filtered, 'avgRing', '平均环数');
    },

    renderFreqStats(all) {
        // 按日期分组统计每天的训练次数
        const dayMap = {};
        for (const r of all) {
            const d = new Date(r.date);
            const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            dayMap[key] = (dayMap[key] || 0) + 1;
        }
        const dayKeys = Object.keys(dayMap).sort();

        // 连续训练天数
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (let i = 0; i < 365; i++) {
            const check = new Date(today);
            check.setDate(check.getDate() - i);
            const key = check.getFullYear() + '-' + String(check.getMonth() + 1).padStart(2, '0') + '-' + String(check.getDate()).padStart(2, '0');
            if (dayMap[key]) streak++;
            else if (i > 0) break;
        }

        // 周均训练次数
        let weekly = 0;
        if (dayKeys.length >= 2) {
            const firstDay = new Date(dayKeys[0]);
            const lastDay = new Date(dayKeys[dayKeys.length - 1]);
            const weeks = Math.max(1, (lastDay - firstDay) / (7 * 86400000));
            weekly = (dayKeys.length / weeks).toFixed(1);
        } else {
            weekly = dayKeys.length;
        }

        // 活跃天数
        const activeDays = dayKeys.length;

        document.getElementById('stats-streak').textContent = streak;
        document.getElementById('stats-weekly').textContent = weekly;
        document.getElementById('stats-active-days').textContent = activeDays;

        // 训练热力图（最近28天）
        const heatmapEl = document.getElementById('stats-freq-heatmap');
        if (heatmapEl) {
            heatmapEl.innerHTML = '';
            const maxCount = Math.max(1, ...Object.values(dayMap));
            for (let i = 27; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                const count = dayMap[key] || 0;
                const cell = document.createElement('div');
                cell.className = 'stats-freq-cell';
                cell.dataset.date = key + (count > 0 ? ' (' + count + '次)' : '');
                const intensity = count / maxCount;
                if (intensity > 0.6) cell.style.background = 'rgba(0, 240, 255, 0.6)';
                else if (intensity > 0.3) cell.style.background = 'rgba(0, 240, 255, 0.3)';
                else if (intensity > 0) cell.style.background = 'rgba(0, 240, 255, 0.15)';
                else cell.style.background = 'rgba(0, 240, 255, 0.05)';
                heatmapEl.appendChild(cell);
            }
        }
    },

    drawLineChart(canvasId, data, field, label) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const pad = { top: 20, right: 20, bottom: 30, left: 40 };
        const cw = w - pad.left - pad.right;
        const ch = h - pad.top - pad.bottom;

        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        if (data.length === 0) return;

        const values = data.map(r => r.summary?.[field] || 0);
        const minV = Math.min(...values);
        const maxV = Math.max(...values);
        const range = maxV - minV || 1;

        // 网格线
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = pad.top + (ch / 4) * i;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(w - pad.right, y);
            ctx.stroke();
        }

        // Y轴标签
        ctx.fillStyle = 'rgba(170, 170, 187, 0.5)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const val = maxV - (range / 4) * i;
            const y = pad.top + (ch / 4) * i;
            ctx.fillText(val.toFixed(0), pad.left - 4, y + 3);
        }

        // 折线
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        data.forEach((r, i) => {
            const x = pad.left + (i / (data.length - 1 || 1)) * cw;
            const v = r.summary?.[field] || 0;
            const y = pad.top + ch - ((v - minV) / range) * ch;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // 数据点
        ctx.fillStyle = '#00f0ff';
        data.forEach((r, i) => {
            const x = pad.left + (i / (data.length - 1 || 1)) * cw;
            const v = r.summary?.[field] || 0;
            const y = pad.top + ch - ((v - minV) / range) * ch;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // X轴日期标签（最多显示5个）
        ctx.fillStyle = 'rgba(170, 170, 187, 0.5)';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        const step = Math.max(1, Math.floor(data.length / 5));
        data.forEach((r, i) => {
            if (i % step === 0 || i === data.length - 1) {
                const x = pad.left + (i / (data.length - 1 || 1)) * cw;
                const d = new Date(r.date);
                ctx.fillText((d.getMonth() + 1) + '/' + d.getDate(), x, h - 10);
            }
        });
    },

    // ========== 账户管理面板 ==========
    openAccount() {
        const overlay = document.getElementById('account-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            this.updateAccountUI();
        }
    },

    closeAccount() {
        const overlay = document.getElementById('account-overlay');
        if (overlay) overlay.classList.add('hidden');
    },

    updateAccountUI() {
        // 头像
        this.updateAccountAvatar();
        // 昵称
        const nick = localStorage.getItem('mingchen_nickname') || '';
        const nickInput = document.getElementById('account-nickname');
        if (nickInput) nickInput.value = nick;
        // 手机号
        const phone = localStorage.getItem('mingchen_phone') || '';
        const phoneInput = document.getElementById('account-phone');
        if (phoneInput) phoneInput.value = phone;
        const statusEl = document.getElementById('account-phone-status');
        if (statusEl) {
            statusEl.textContent = phone ? '已绑定: ' + phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '未绑定手机号';
        }
        // 同步状态
        this.updateSyncUI();
    },

    updateSyncUI() {
        if (typeof Sync === 'undefined') return;
        const timeEl = document.getElementById('sync-last-time');
        const countEl = document.getElementById('sync-cloud-count');
        if (timeEl) timeEl.textContent = Sync.formatLastSync();
        if (countEl) countEl.textContent = Sync.status.cloudRecordCount || 0;
    },

    updateAccountAvatar() {
        const avatarData = localStorage.getItem('mingchen_avatar');
        const els = [
            document.getElementById('account-avatar'),
            document.querySelector('.user-avatar')
        ];
        els.forEach(el => {
            if (!el) return;
            if (avatarData) {
                el.innerHTML = '<img src="' + avatarData + '" alt="avatar">';
            } else {
                el.innerHTML = '&#128100;';
            }
        });
    },

    // ========== 主题与外观 ==========
    initThemeControls() {
        const saved = localStorage.getItem('mingchen_theme');
        const theme = saved ? JSON.parse(saved) : {};

        // 应用保存的主题
        document.body.setAttribute('data-theme-color', theme.color || 'cyan');
        document.body.setAttribute('data-glow-intensity', theme.glow || 'medium');
        document.body.setAttribute('data-font-size', theme.font || 'medium');
        document.body.setAttribute('data-bg-scanline', theme.scanline !== false ? 'true' : 'false');
        document.body.setAttribute('data-bg-grid', theme.grid !== false ? 'true' : 'false');
        document.body.setAttribute('data-bg-particles', theme.particles !== false ? 'true' : 'false');

        // 强调色切换
        const colorBtns = document.querySelectorAll('.theme-color-btn[data-color]');
        colorBtns.forEach(btn => {
            if (btn.dataset.color === (theme.color || 'cyan')) btn.classList.add('active');
            else btn.classList.remove('active');
            btn.addEventListener('click', () => {
                colorBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.body.setAttribute('data-theme-color', btn.dataset.color);
                this.saveTheme({ color: btn.dataset.color });
            });
        });

        // 发光强度
        const glowBtns = document.querySelectorAll('.theme-seg-btn[data-glow]');
        glowBtns.forEach(btn => {
            if (btn.dataset.glow === (theme.glow || 'medium')) btn.classList.add('active');
            else btn.classList.remove('active');
            btn.addEventListener('click', () => {
                glowBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.body.setAttribute('data-glow-intensity', btn.dataset.glow);
                this.saveTheme({ glow: btn.dataset.glow });
            });
        });

        // 动态背景开关
        const bgScanline = document.getElementById('setting-bg-scanline');
        const bgGrid = document.getElementById('setting-bg-grid');
        const bgParticles = document.getElementById('setting-bg-particles');
        if (bgScanline) {
            bgScanline.checked = theme.scanline !== false;
            bgScanline.addEventListener('change', (e) => {
                document.body.setAttribute('data-bg-scanline', e.target.checked ? 'true' : 'false');
                this.saveTheme({ scanline: e.target.checked });
            });
        }
        if (bgGrid) {
            bgGrid.checked = theme.grid !== false;
            bgGrid.addEventListener('change', (e) => {
                document.body.setAttribute('data-bg-grid', e.target.checked ? 'true' : 'false');
                this.saveTheme({ grid: e.target.checked });
            });
        }
        if (bgParticles) {
            bgParticles.checked = theme.particles !== false;
            bgParticles.addEventListener('change', (e) => {
                document.body.setAttribute('data-bg-particles', e.target.checked ? 'true' : 'false');
                this.saveTheme({ particles: e.target.checked });
            });
        }

        // 字体大小
        const fontBtns = document.querySelectorAll('.theme-seg-btn[data-font]');
        fontBtns.forEach(btn => {
            if (btn.dataset.font === (theme.font || 'medium')) btn.classList.add('active');
            else btn.classList.remove('active');
            btn.addEventListener('click', () => {
                fontBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.body.setAttribute('data-font-size', btn.dataset.font);
                this.saveTheme({ font: btn.dataset.font });
                this.applyFontSize(btn.dataset.font);
            });
        });
        this.applyFontSize(theme.font || 'medium');
    },

    saveTheme(updates) {
        const saved = localStorage.getItem('mingchen_theme');
        const current = saved ? JSON.parse(saved) : {};
        const merged = { ...current, ...updates };
        localStorage.setItem('mingchen_theme', JSON.stringify(merged));
    },

    applyFontSize(size) {
        const scale = size === 'small' ? 0.88 : size === 'large' ? 1.14 : 1;
        let style = document.getElementById('dynamic-font-size');
        if (!style) {
            style = document.createElement('style');
            style.id = 'dynamic-font-size';
            document.head.appendChild(style);
        }
        const s = (base) => Math.round(base * scale) + 'px';
        style.textContent = `
            .brand { font-size: ${s(16)} !important; }
            .result-title { font-size: ${s(16)} !important; }
            .result-subtitle { font-size: ${s(14)} !important; }
            .panel-title { font-size: ${s(20)} !important; }
            .settings-title { font-size: ${s(16)} !important; }
            .settings-group-title { font-size: ${s(11)} !important; }
            .settings-label { font-size: ${s(13)} !important; }
            .metric-value { font-size: ${s(16)} !important; }
            .metric-label { font-size: ${s(10)} !important; }
            .btn-start { font-size: ${s(12)} !important; }
            .btn-primary { font-size: ${s(12)} !important; }
            .btn-secondary { font-size: ${s(12)} !important; }
            .btn-icon { font-size: ${s(14)} !important; }
            .btn-calibrate { font-size: ${s(11)} !important; }
            .nav-item { font-size: ${s(13)} !important; }
            #ammo-display { font-size: ${s(14)} !important; }
            .about-label { font-size: ${s(12)} !important; }
            .about-desc { font-size: ${s(11)} !important; }
            .history-title { font-size: ${s(18)} !important; }
            .history-item-time { font-size: ${s(12)} !important; }
            .user-profile-name { font-size: ${s(18)} !important; }
            .user-profile-info { font-size: ${s(12)} !important; }
            .user-profile-menu-label { font-size: ${s(13)} !important; }
            .account-group-title { font-size: ${s(11)} !important; }
            .account-input { font-size: ${s(13)} !important; }
            .account-input-btn { font-size: ${s(12)} !important; }
            .account-danger-btn { font-size: ${s(13)} !important; }
            .theme-seg-btn { font-size: ${s(12)} !important; }
            .theme-toggle { font-size: ${s(12)} !important; }
            #app-toast { font-size: ${s(13)} !important; }
            #app-confirm-input input { font-size: ${s(13)} !important; }
            #app-confirm-input button { font-size: ${s(12)} !important; }
            .sync-status-val { font-size: ${s(14)} !important; }
            .sync-status-label { font-size: ${s(10)} !important; }
            .card-title { font-size: ${s(11)} !important; }
            .card-value { font-size: ${s(16)} !important; }
            .card-unit { font-size: ${s(10)} !important; }
            .stats-section-title { font-size: ${s(12)} !important; }
            .detail-section-title { font-size: ${s(12)} !important; }
            .share-btn { font-size: ${s(12)} !important; }
            .detail-btn { font-size: ${s(11)} !important; }
            .replay-btn { font-size: ${s(12)} !important; }
            .shot-legend-item span { font-size: ${s(10)} !important; }
            .player-name { font-size: ${s(14)} !important; }
            .player-title { font-size: ${s(11)} !important; }
            .tag { font-size: ${s(9)} !important; }
        `;
    },

    // ========== 帮助与反馈 ==========
    openHelp(id) {
        const overlay = document.getElementById('help-' + id + '-overlay');
        if (overlay) overlay.classList.remove('hidden');
    },

    closeHelp(id) {
        const overlay = document.getElementById('help-' + id + '-overlay');
        if (overlay) overlay.classList.add('hidden');
    },

    checkUpdate() {
        this.showToast('正在检查更新...');
        setTimeout(() => {
            this.showToast('当前已是最新版本 v1.0.0');
        }, 1500);
    },

    submitFeedback() {
        const type = document.getElementById('feedback-type');
        const content = document.getElementById('feedback-content');
        const contact = document.getElementById('feedback-contact');
        const screenshot = document.getElementById('feedback-screenshot');

        if (!content || !content.value.trim()) {
            this.showToast('请填写问题描述');
            return;
        }

        const data = {
            type: type ? type.value : 'other',
            content: content.value.trim(),
            contact: contact ? contact.value.trim() : '',
            screenshot: screenshot && screenshot.files[0] ? screenshot.files[0].name : null,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };

        // 实际项目中这里应发送到后端 API
        console.log('[反馈提交]', data);
        this.showToast('反馈已提交，感谢您的建议！');

        // 清空表单
        if (content) content.value = '';
        if (contact) contact.value = '';
        if (screenshot) screenshot.value = '';

        // 关闭面板
        this.closeHelp('feedback');
    }
};

// 启动
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
