(function() {
    const VALID_STATES = ['menu', 'intro', 'tutorial', 'playing', 'ending'];

    class SceneManager {
        constructor() {
            this.currentState = null;
            this.scenes = {};
            this.callbacks = [];
            this.game = null;
            this.cutsceneCanvas = null;
            this.cutsceneCtx = null;
            this.lastTime = 0;
            this.running = false;
        }

        init(game) {
            this.game = game;
            this.cutsceneCanvas = document.getElementById('cutscene-canvas');
            this.cutsceneCtx = this.cutsceneCanvas ? this.cutsceneCanvas.getContext('2d') : null;

            if (this.cutsceneCanvas) {
                this.cutsceneCanvas.addEventListener('click', (e) => {
                    const rect = this.cutsceneCanvas.getBoundingClientRect();
                    const x = (e.clientX - rect.left) * (1280 / rect.width);
                    const y = (e.clientY - rect.top) * (720 / rect.height);
                    if (this.currentState && this.scenes[this.currentState]) {
                        this.scenes[this.currentState].handleClick(x, y);
                    }
                });
                this.cutsceneCanvas.addEventListener('mousedown', (e) => {
                    const rect = this.cutsceneCanvas.getBoundingClientRect();
                    const x = (e.clientX - rect.left) * (1280 / rect.width);
                    const y = (e.clientY - rect.top) * (720 / rect.height);
                    if (this.currentState && this.scenes[this.currentState]) {
                        this.scenes[this.currentState].handleMouseDown(x, y);
                    }
                });
                this.cutsceneCanvas.addEventListener('mouseup', (e) => {
                    const rect = this.cutsceneCanvas.getBoundingClientRect();
                    const x = (e.clientX - rect.left) * (1280 / rect.width);
                    const y = (e.clientY - rect.top) * (720 / rect.height);
                    if (this.currentState && this.scenes[this.currentState]) {
                        this.scenes[this.currentState].handleMouseUp(x, y);
                    }
                });
                this.cutsceneCanvas.addEventListener('mouseleave', (e) => {
                    if (this.currentState && this.scenes[this.currentState]) {
                        this.scenes[this.currentState].handleMouseUp(0, 0);
                    }
                });
                this.cutsceneCanvas.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    const rect = this.cutsceneCanvas.getBoundingClientRect();
                    const touch = e.touches[0];
                    const x = (touch.clientX - rect.left) * (1280 / rect.width);
                    const y = (touch.clientY - rect.top) * (720 / rect.height);
                    if (this.currentState && this.scenes[this.currentState]) {
                        this.scenes[this.currentState].handleMouseDown(x, y);
                    }
                }, { passive: false });
                this.cutsceneCanvas.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    if (this.currentState && this.scenes[this.currentState]) {
                        this.scenes[this.currentState].handleMouseUp(0, 0);
                    }
                }, { passive: false });
            }

            this.scenes = {
                menu: new MenuScene(this),
                intro: new IntroScene(this),
                tutorial: new TutorialScene(this),
                playing: new PlayingScene(this),
                ending: new EndingScene(this)
            };
        }

        setState(state) {
            if (!VALID_STATES.includes(state)) {
                console.warn('Invalid state:', state);
                return;
            }
            if (this.currentState === state) return;

            const prevState = this.currentState;
            if (prevState && this.scenes[prevState]) {
                this.scenes[prevState].exit();
            }

            this.currentState = state;

            this.updateCanvasVisibility();

            if (this.scenes[state]) {
                this.scenes[state].enter();
            }

            for (const cb of this.callbacks) {
                cb(state, prevState);
            }

            if (!this.running) {
                this.running = true;
                this.lastTime = performance.now();
                requestAnimationFrame(this.loop.bind(this));
            }
        }

        getState() {
            return this.currentState;
        }

        onStateChange(callback) {
            this.callbacks.push(callback);
        }

        updateCanvasVisibility() {
            if (this.currentState === 'playing') {
                if (this.cutsceneCanvas) this.cutsceneCanvas.style.display = 'none';
            } else if (this.currentState === 'tutorial') {
                if (this.cutsceneCanvas) {
                    this.cutsceneCanvas.style.display = 'block';
                    this.cutsceneCanvas.style.pointerEvents = 'none';
                }
            } else {
                if (this.cutsceneCanvas) {
                    this.cutsceneCanvas.style.display = 'block';
                    this.cutsceneCanvas.style.pointerEvents = '';
                }
            }
        }

        showCutsceneCanvas() {
            if (this.cutsceneCanvas) {
                this.cutsceneCanvas.style.display = 'block';
            }
        }

        hideCutsceneCanvas() {
            if (this.cutsceneCanvas) {
                this.cutsceneCanvas.style.display = 'none';
            }
        }

        getCutsceneCtx() {
            return this.cutsceneCtx;
        }

        loop(timestamp) {
            if (!this.running) return;

            let dt = timestamp - this.lastTime;
            this.lastTime = timestamp;
            if (dt > 100) dt = 100;

            if (this.currentState && this.scenes[this.currentState]) {
                this.scenes[this.currentState].update(dt);
                if (this.cutsceneCtx && this.currentState !== 'playing') {
                    this.cutsceneCtx.imageSmoothingEnabled = false;
                    this.cutsceneCtx.clearRect(0, 0, 1280, 720);
                    this.scenes[this.currentState].render(this.cutsceneCtx);
                }
            }

            requestAnimationFrame(this.loop.bind(this));
        }
    }

    class MenuScene {
        constructor(manager) {
            this.manager = manager;
            this.stars = [];
            this.fogBands = [];
            this.elapsed = 0;
        }

        enter() {
            this.elapsed = 0;
            this.stars = [];
            this.fogBands = [];

            if (window.GameAudio && window.GameAudio.isInitialized()) {
                window.GameAudio.playAmbient();
            }

            const startBtn = document.getElementById('start-btn');
            if (startBtn) {
                this._startBtnHover = () => {
                    if (window.GameAudio && window.GameAudio.isInitialized()) {
                        window.GameAudio.playSfx('buttonHover');
                    }
                };
                startBtn.addEventListener('mouseenter', this._startBtnHover);
            }

            const starCount = 60 + Math.floor(Math.random() * 21);
            for (let i = 0; i < starCount; i++) {
                this.stars.push({
                    x: Math.random() * 1280,
                    y: Math.random() * 720,
                    size: 0.8 + Math.random() * 2.2,
                    baseAlpha: 0.2 + Math.random() * 0.6,
                    phase: Math.random() * Math.PI * 2,
                    speed: 0.3 + Math.random() * 0.8,
                    color: Math.random() > 0.4
                        ? { r: 255, g: 220, b: 140 }
                        : { r: 255, g: 255, b: 240 }
                });
            }

            const fogCount = 4;
            for (let i = 0; i < fogCount; i++) {
                this.fogBands.push({
                    x: Math.random() * 1280,
                    y: 80 + Math.random() * 560,
                    width: 300 + Math.random() * 500,
                    height: 20 + Math.random() * 40,
                    speed: 8 + Math.random() * 16,
                    alpha: 0.03 + Math.random() * 0.06
                });
            }
        }

        update(dt) {
            this.elapsed += dt;
            const dtSec = dt / 1000;

            for (const star of this.stars) {
                star.phase += dtSec * star.speed;
            }

            for (const fog of this.fogBands) {
                fog.x -= fog.speed * dtSec;
                if (fog.x + fog.width < -100) {
                    fog.x = 1280 + Math.random() * 200;
                    fog.y = 80 + Math.random() * 560;
                    fog.width = 300 + Math.random() * 500;
                    fog.height = 20 + Math.random() * 40;
                    fog.speed = 8 + Math.random() * 16;
                    fog.alpha = 0.03 + Math.random() * 0.06;
                }
            }
        }

        render(ctx) {
            const edgeGradient = ctx.createRadialGradient(640, 360, 200, 640, 360, 650);
            edgeGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            edgeGradient.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
            ctx.fillStyle = edgeGradient;
            ctx.fillRect(0, 0, 1280, 720);

            const topGradient = ctx.createLinearGradient(0, 0, 0, 200);
            topGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
            topGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = topGradient;
            ctx.fillRect(0, 0, 1280, 200);

            const bottomGradient = ctx.createLinearGradient(0, 520, 0, 720);
            bottomGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            bottomGradient.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
            ctx.fillStyle = bottomGradient;
            ctx.fillRect(0, 520, 1280, 200);

            for (const fog of this.fogBands) {
                const fogGrad = ctx.createLinearGradient(fog.x, fog.y, fog.x + fog.width, fog.y);
                fogGrad.addColorStop(0, `rgba(80, 75, 90, 0)`);
                fogGrad.addColorStop(0.3, `rgba(80, 75, 90, ${fog.alpha})`);
                fogGrad.addColorStop(0.7, `rgba(80, 75, 90, ${fog.alpha * 0.8})`);
                fogGrad.addColorStop(1, `rgba(80, 75, 90, 0)`);
                ctx.fillStyle = fogGrad;
                ctx.beginPath();
                ctx.ellipse(
                    fog.x + fog.width / 2,
                    fog.y + fog.height / 2,
                    fog.width / 2,
                    fog.height / 2,
                    0, 0, Math.PI * 2
                );
                ctx.fill();
            }

            for (const star of this.stars) {
                const twinkle = 0.5 + 0.5 * Math.sin(star.phase);
                const alpha = star.baseAlpha * (0.4 + 0.6 * twinkle);
                const { r, g, b } = star.color;

                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size * 2.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.15})`;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                ctx.fill();

                if (star.size > 1.5 && twinkle > 0.7) {
                    ctx.beginPath();
                    ctx.moveTo(star.x - star.size * 3, star.y);
                    ctx.lineTo(star.x + star.size * 3, star.y);
                    ctx.moveTo(star.x, star.y - star.size * 3);
                    ctx.lineTo(star.x, star.y + star.size * 3);
                    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }

            const vignette = ctx.createRadialGradient(640, 360, 100, 640, 360, 700);
            vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
            vignette.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, 1280, 720);
        }

        handleClick(x, y) {}

        handleMouseDown(x, y) {}

        handleMouseUp(x, y) {}

        exit() {
            this.stars = [];
            this.fogBands = [];

            const startBtn = document.getElementById('start-btn');
            if (startBtn && this._startBtnHover) {
                startBtn.removeEventListener('mouseenter', this._startBtnHover);
                this._startBtnHover = null;
            }
        }
    }

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function easeInCubic(t) {
        return t * t * t;
    }

    function easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    class IntroScene {
        constructor(manager) {
            this.manager = manager;
            this.elapsed = 0;
            this.transitioning = false;
            this.particles = [];
            this.cards = ['zengbo', 'zilong', 'huying'];
            this.playedCardSfx = [false, false, false];

            this.T_PHASE0_END = 800;
            this.T_TEXT_START = 800;
            this.T_TEXT_FADEIN_END = 1300;
            this.T_TEXT_HOLD_END = 2800;
            this.T_TEXT_FADEOUT_END = 3500;
            this.T_CARD0_START = 3500;
            this.T_CARD0_ENTER_END = 4300;
            this.T_CARD1_START = 8300;
            this.T_CARD1_ENTER_END = 9100;
            this.T_CARD2_START = 13100;
            this.T_CARD2_ENTER_END = 13900;
            this.T_CARD2_HOLD_END = 17900;
            this.T_LAYOUT_ADJUST_END = 18500;
            this.T_ALL_HOLD_END = 20200;
            this.T_FADEOUT_END = 21000;
            this.T_TOTAL = 21000;

            this.SKIP_HOLD_DURATION = 3000;
            this.pressStartTime = 0;
            this.isPressing = false;
            this.skipProgress = 0;
        }

        enter() {
            this.elapsed = 0;
            this.transitioning = false;
            this.particles = [];
            this.playedCardSfx = [false, false, false];
            this.pressStartTime = 0;
            this.isPressing = false;
            this.skipProgress = 0;

            const particleCount = 15;
            for (let i = 0; i < particleCount; i++) {
                this.particles.push({
                    x: Math.random() * 1280,
                    y: Math.random() * 720,
                    size: 1 + Math.random() * 2,
                    alpha: 0.2 + Math.random() * 0.4,
                    speed: 0.2 + Math.random() * 0.5,
                    phase: Math.random() * Math.PI * 2
                });
            }
        }

        update(dt) {
            this.elapsed += dt;
            const dtSec = dt / 1000;
            const t = this.elapsed;

            if (window.GameAudio && window.GameAudio.isInitialized()) {
                if (!this.playedCardSfx[0] && t >= this.T_CARD0_ENTER_END - 200) {
                    this.playedCardSfx[0] = true;
                    window.GameAudio.playSfx('cardPop');
                }
                if (!this.playedCardSfx[1] && t >= this.T_CARD1_ENTER_END - 200) {
                    this.playedCardSfx[1] = true;
                    window.GameAudio.playSfx('cardPop');
                }
                if (!this.playedCardSfx[2] && t >= this.T_CARD2_ENTER_END - 200) {
                    this.playedCardSfx[2] = true;
                    window.GameAudio.playSfx('cardPop');
                }
            }

            for (const p of this.particles) {
                p.y -= p.speed * dtSec * 20;
                p.phase += dtSec * 0.5;
                if (p.y < -10) {
                    p.y = 730;
                    p.x = Math.random() * 1280;
                }
            }

            if (this.isPressing && !this.transitioning) {
                const pressDuration = this.elapsed - this.pressStartTime;
                this.skipProgress = clamp(pressDuration / this.SKIP_HOLD_DURATION, 0, 1);
                if (pressDuration >= this.SKIP_HOLD_DURATION) {
                    this.transitioning = true;
                    setTimeout(() => {
                        this.manager.setState('tutorial');
                    }, 0);
                }
            }

            if (this.elapsed >= this.T_FADEOUT_END && !this.transitioning) {
                this.transitioning = true;
                setTimeout(() => {
                    this.manager.setState('tutorial');
                }, 0);
            }
        }

        render(ctx) {
            const assets = this.manager.game ? this.manager.game.assets : null;
            const t = this.elapsed;

            this.renderBackground(ctx, t);

            if (t > this.T_TEXT_START) {
                this.renderParticles(ctx, t);
            }

            if (t >= this.T_TEXT_START && t < this.T_CARD2_START + 500) {
                this.renderText(ctx, t);
                this.renderDecorLine(ctx, t);
            }

            this.renderCards(ctx, t, assets);

            this.renderSkipHint(ctx, t);

            this.renderFadeOut(ctx, t);
        }

        renderBackground(ctx, t) {
            ctx.fillStyle = 'rgb(10, 8, 12)';
            ctx.fillRect(0, 0, 1280, 720);

            const bgAlpha = t < this.T_PHASE0_END ? easeOutCubic(t / this.T_PHASE0_END) : 1;
            const gradient = ctx.createRadialGradient(640, 360, 100, 640, 360, 600);
            gradient.addColorStop(0, `rgba(30, 25, 35, ${bgAlpha * 0.5})`);
            gradient.addColorStop(1, `rgba(10, 8, 12, ${bgAlpha})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1280, 720);
        }

        renderParticles(ctx, t) {
            const particleFade = clamp((t - this.T_TEXT_START) / 500, 0, 1);
            for (const p of this.particles) {
                const twinkle = 0.5 + 0.5 * Math.sin(p.phase);
                const alpha = p.alpha * particleFade * twinkle;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 220, 150, ${alpha * 0.2})`;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 230, 170, ${alpha})`;
                ctx.fill();
            }
        }

        renderText(ctx, t) {
            const text = '流落海外的灵物，今夜归乡。';
            const charCount = text.length;
            const charInterval = 150;

            let textAlpha;
            if (t < this.T_TEXT_FADEIN_END) {
                textAlpha = easeOutCubic((t - this.T_TEXT_START) / (this.T_TEXT_FADEIN_END - this.T_TEXT_START));
            } else if (t < this.T_CARD2_START) {
                textAlpha = 1;
            } else if (t < this.T_CARD2_START + 600) {
                textAlpha = lerp(1, 0, (t - this.T_CARD2_START) / 600);
            } else {
                textAlpha = 0;
            }
            textAlpha = clamp(textAlpha, 0, 1);

            ctx.save();
            ctx.font = '32px "STKaiti", "KaiTi", "楷体", "Microsoft YaHei", serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const baseY = 200;
            const charWidth = ctx.measureText('国').width;
            const totalWidth = charWidth * charCount;
            const startX = 640 - totalWidth / 2 + charWidth / 2;

            for (let i = 0; i < charCount; i++) {
                const charStartTime = this.T_TEXT_START + i * charInterval;
                let charAlpha;
                if (t < charStartTime) {
                    charAlpha = 0;
                } else if (t < charStartTime + 200) {
                    charAlpha = easeOutCubic((t - charStartTime) / 200);
                } else {
                    charAlpha = 1;
                }
                charAlpha *= textAlpha;

                ctx.fillStyle = `rgba(255, 220, 150, ${0.9 * charAlpha})`;
                ctx.shadowColor = `rgba(255, 200, 100, ${0.5 * charAlpha})`;
                ctx.shadowBlur = 10;
                ctx.fillText(text[i], startX + i * charWidth, baseY);
            }
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        renderDecorLine(ctx, t) {
            let lineProgress;
            if (t < this.T_TEXT_START + 200) {
                lineProgress = 0;
            } else if (t < this.T_TEXT_FADEIN_END) {
                lineProgress = easeOutCubic((t - this.T_TEXT_START - 200) / 300);
            } else if (t < this.T_CARD2_START) {
                lineProgress = 1;
            } else if (t < this.T_CARD2_START + 400) {
                lineProgress = clamp(1 - (t - this.T_CARD2_START) / 400, 0, 1);
            } else {
                lineProgress = 0;
            }

            if (lineProgress <= 0) return;

            const lineY = 250;
            const maxWidth = 200;
            const currentWidth = maxWidth * lineProgress;

            ctx.save();
            ctx.strokeStyle = `rgba(255, 215, 100, ${0.6 * lineProgress})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(640 - currentWidth, lineY);
            ctx.lineTo(640 + currentWidth, lineY);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(640 - currentWidth, lineY, 2, 0, Math.PI * 2);
            ctx.arc(640 + currentWidth, lineY, 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 220, 150, ${0.8 * lineProgress})`;
            ctx.fill();
            ctx.restore();
        }

        getCardState(t) {
            const states = [
                { visible: false, x: 0, y: 0, w: 0, h: 0, alpha: 0, progress: 0 },
                { visible: false, x: 0, y: 0, w: 0, h: 0, alpha: 0, progress: 0 },
                { visible: false, x: 0, y: 0, w: 0, h: 0, alpha: 0, progress: 0 }
            ];

            const centerX = 640;
            const centerY = 380;
            const bigW = 650, bigH = 450;
            const mediumW = 420, mediumH = 291;
            const smallW = 360, smallH = 249;
            const finalW = 380, finalH = 263;
            const finalGap = 45;
            const totalFinalW = finalW * 3 + finalGap * 2;
            const finalStartX = centerX - totalFinalW / 2;
            const finalY = centerY - finalH / 2;

            if (t < this.T_CARD0_START) {
                return states;
            }

            if (t < this.T_CARD1_START) {
                let enterT = clamp((t - this.T_CARD0_START) / (this.T_CARD0_ENTER_END - this.T_CARD0_START), 0, 1);
                enterT = easeOutCubic(enterT);
                const w = bigW, h = bigH;
                states[0] = {
                    visible: true,
                    x: centerX - w / 2,
                    y: centerY - h / 2,
                    w: w,
                    h: h,
                    alpha: 1,
                    progress: enterT,
                    focused: true
                };
                return states;
            }

            if (t < this.T_CARD2_START) {
                const transT = clamp((t - this.T_CARD1_START) / (this.T_CARD1_ENTER_END - this.T_CARD1_START), 0, 1);
                const transEase = easeOutCubic(transT);

                const twoCardGap = 60;
                const twoCardTotalW = mediumW + bigW + twoCardGap;
                const twoCardStartX = centerX - twoCardTotalW / 2;

                const w0 = lerp(bigW, mediumW, transEase);
                const h0 = lerp(bigH, mediumH, transEase);
                const x0 = lerp(centerX - bigW / 2, twoCardStartX, transEase);
                const y0 = lerp(centerY - bigH / 2, centerY - mediumH / 2, transEase);
                const alpha0 = lerp(1, 0.85, transEase);

                const w1 = bigW, h1 = bigH;
                const x1 = lerp(centerX + 100, twoCardStartX + mediumW + twoCardGap, transEase);
                const y1 = centerY - h1 / 2;

                states[0] = {
                    visible: true,
                    x: x0,
                    y: y0,
                    w: w0,
                    h: h0,
                    alpha: alpha0,
                    progress: 1,
                    focused: false
                };
                states[1] = {
                    visible: true,
                    x: x1,
                    y: y1,
                    w: w1,
                    h: h1,
                    alpha: 1,
                    progress: easeOutCubic(transT),
                    focused: true
                };
                return states;
            }

            if (t < this.T_CARD2_HOLD_END) {
                const enterT = clamp((t - this.T_CARD2_START) / (this.T_CARD2_ENTER_END - this.T_CARD2_START), 0, 1);
                const enterEase = easeOutCubic(enterT);

                const twoCardGap = 60;
                const twoCardTotalW = mediumW + bigW + twoCardGap;
                const twoCardStartX = centerX - twoCardTotalW / 2;

                const holdGap = 40;
                const holdCard2X = 1280 - bigW - 50;
                const holdCard1X = holdCard2X - smallW - holdGap;
                const holdCard0X = holdCard1X - smallW + 80;
                const holdAlpha0 = 0.5;

                const w0 = lerp(mediumW, smallW, enterEase);
                const h0 = lerp(mediumH, smallH, enterEase);
                const x0 = lerp(twoCardStartX, holdCard0X, enterEase);
                const y0 = lerp(centerY - mediumH / 2, centerY - smallH / 2, enterEase);
                const alpha0 = lerp(0.85, holdAlpha0, enterEase);

                const w1 = lerp(bigW, smallW, enterEase);
                const h1 = lerp(bigH, smallH, enterEase);
                const x1 = lerp(twoCardStartX + mediumW + twoCardGap, holdCard1X, enterEase);
                const y1 = lerp(centerY - bigH / 2, centerY - smallH / 2, enterEase);
                const alpha1 = lerp(1, 0.7, enterEase);

                const w2 = lerp(0, bigW, enterEase);
                const h2 = lerp(0, bigH, enterEase);
                const x2 = lerp(centerX + 150, holdCard2X, enterEase);
                const y2 = centerY - h2 / 2;

                states[0] = {
                    visible: true,
                    x: x0,
                    y: y0,
                    w: w0,
                    h: h0,
                    alpha: alpha0,
                    progress: 1,
                    focused: false
                };
                states[1] = {
                    visible: true,
                    x: x1,
                    y: y1,
                    w: w1,
                    h: h1,
                    alpha: alpha1,
                    progress: 1,
                    focused: false
                };
                states[2] = {
                    visible: true,
                    x: x2,
                    y: y2,
                    w: w2,
                    h: h2,
                    alpha: enterEase,
                    progress: enterEase,
                    focused: true
                };
                return states;
            }

            if (t < this.T_LAYOUT_ADJUST_END) {
                const adjustT = clamp((t - this.T_CARD2_HOLD_END) / (this.T_LAYOUT_ADJUST_END - this.T_CARD2_HOLD_END), 0, 1);
                const adjustEase = easeOutCubic(adjustT);

                const holdGap = 40;
                const holdCard2X = 1280 - bigW - 50;
                const holdCard1X = holdCard2X - smallW - holdGap;
                const holdCard0X = holdCard1X - smallW + 80;

                const w0 = lerp(smallW, finalW, adjustEase);
                const h0 = lerp(smallH, finalH, adjustEase);
                const x0 = lerp(holdCard0X, finalStartX, adjustEase);
                const y0 = lerp(centerY - smallH / 2, finalY, adjustEase);
                const alpha0 = lerp(0.5, 1, adjustEase);

                const w1 = lerp(smallW, finalW, adjustEase);
                const h1 = lerp(smallH, finalH, adjustEase);
                const x1 = lerp(holdCard1X, finalStartX + finalW + finalGap, adjustEase);
                const y1 = lerp(centerY - smallH / 2, finalY, adjustEase);
                const alpha1 = lerp(0.7, 1, adjustEase);

                const w2 = lerp(bigW, finalW, adjustEase);
                const h2 = lerp(bigH, finalH, adjustEase);
                const x2 = lerp(holdCard2X, finalStartX + (finalW + finalGap) * 2, adjustEase);
                const y2 = lerp(centerY - bigH / 2, finalY, adjustEase);

                states[0] = {
                    visible: true,
                    x: x0,
                    y: y0,
                    w: w0,
                    h: h0,
                    alpha: alpha0,
                    progress: 1,
                    focused: false
                };
                states[1] = {
                    visible: true,
                    x: x1,
                    y: y1,
                    w: w1,
                    h: h1,
                    alpha: alpha1,
                    progress: 1,
                    focused: false
                };
                states[2] = {
                    visible: true,
                    x: x2,
                    y: y2,
                    w: w2,
                    h: h2,
                    alpha: 1,
                    progress: 1,
                    focused: true
                };
                return states;
            }

            states[0] = {
                visible: true,
                x: finalStartX,
                y: finalY,
                w: finalW,
                h: finalH,
                alpha: 1,
                progress: 1,
                focused: false
            };
            states[1] = {
                visible: true,
                x: finalStartX + finalW + finalGap,
                y: finalY,
                w: finalW,
                h: finalH,
                alpha: 1,
                progress: 1,
                focused: false
            };
            states[2] = {
                visible: true,
                x: finalStartX + (finalW + finalGap) * 2,
                y: finalY,
                w: finalW,
                h: finalH,
                alpha: 1,
                progress: 1,
                focused: true
            };
            return states;
        }

        renderCards(ctx, t, assets) {
            if (!assets || !window.CharacterCard) return;

            const states = this.getCardState(t);

            for (let i = 0; i < 3; i++) {
                const s = states[i];
                if (!s.visible || s.alpha <= 0) continue;

                ctx.save();
                ctx.globalAlpha = s.alpha;
                window.CharacterCard.draw(
                    ctx,
                    this.cards[i],
                    s.x,
                    s.y,
                    s.w,
                    s.h,
                    assets,
                    s.progress
                );
                ctx.restore();
            }
        }

        renderSkipHint(ctx, t) {
            if (t < 1000) return;
            let alpha = clamp((t - 1000) / 500, 0, 1);
            if (t > this.T_ALL_HOLD_END - 500) {
                alpha *= clamp(1 - (t - (this.T_ALL_HOLD_END - 500)) / 1000, 0, 1);
            }
            alpha *= 0.5;

            ctx.save();
            ctx.font = '14px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillStyle = `rgba(200, 200, 200, ${alpha})`;
            ctx.fillText('长按跳过', 1260, 700);

            if (this.isPressing && this.skipProgress > 0) {
                const barW = 120;
                const barH = 6;
                const barX = 1260 - barW;
                const barY = 700 - 18;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(barX, barY, barW, barH);

                const progressW = barW * this.skipProgress;
                const progressGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
                progressGrad.addColorStop(0, '#ffd700');
                progressGrad.addColorStop(1, '#ff8c00');
                ctx.fillStyle = progressGrad;
                ctx.fillRect(barX, barY, progressW, barH);

                ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
                ctx.lineWidth = 1;
                ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);
            }

            ctx.restore();
        }

        renderFadeOut(ctx, t) {
            if (t < this.T_ALL_HOLD_END) return;
            const fadeT = clamp((t - this.T_ALL_HOLD_END) / (this.T_FADEOUT_END - this.T_ALL_HOLD_END), 0, 1);
            const fadeAlpha = easeInOutCubic(fadeT);
            ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
            ctx.fillRect(0, 0, 1280, 720);
        }

        handleClick(x, y) {}

        handleMouseDown(x, y) {
            if (this.elapsed < 500) return;
            if (this.transitioning) return;
            this.isPressing = true;
            this.pressStartTime = this.elapsed;
        }

        handleMouseUp(x, y) {
            this.isPressing = false;
            this.skipProgress = 0;
        }

        exit() {
            this.particles = [];
        }
    }

    class TutorialScene {
        constructor(manager) {
            this.manager = manager;
            this.step = 0;
            this.elapsed = 0;
            this.initialSpiritCount = 0;
            this.initialLingyun = 0;
            this.step2Collected = false;
            this.step2CollectTime = 0;
            this.transitioning = false;
        }

        enter() {
            this.step = 1;
            this.elapsed = 0;
            this.step2Collected = false;
            this.step2CollectTime = 0;
            this.transitioning = false;
            if (this.manager.game) {
                this.manager.game.tutorialMode = true;
                this.manager.game.startBattle();
                this.initialSpiritCount = this.manager.game.spirits.filter(s => !s.dead).length;
                this.initialLingyun = this.manager.game.lingyun;
            }
        }

        update(dt) {
            this.elapsed += dt;
            const game = this.manager.game;
            if (!game || this.transitioning) return;

            if (this.step === 1) {
                const aliveSpirits = game.spirits.filter(s => !s.dead).length;
                if (aliveSpirits > this.initialSpiritCount) {
                    this.step = 2;
                    this.elapsed = 0;
                    this.initialLingyun = game.lingyun;
                    this.step2Collected = false;
                }
            } else if (this.step === 2) {
                if (!this.step2Collected && game.lingyun > this.initialLingyun) {
                    this.step2Collected = true;
                    this.step2CollectTime = this.elapsed;
                }
                if (this.step2Collected && this.elapsed - this.step2CollectTime >= 4500) {
                    this.transitioning = true;
                    setTimeout(() => {
                        this.manager.setState('playing');
                    }, 300);
                }
            }
        }

        render(ctx) {
            const W = 1280, H = 720;
            const t = this.elapsed / 1000;

            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, W, H);

            if (this.step === 1) {
                this.renderStep1(ctx, W, H, t);
            } else if (this.step === 2) {
                this.renderStep2(ctx, W, H, t);
            }

            ctx.restore();
        }

        renderStep1(ctx, W, H, t) {
            const cardAreaTop = 590;
            const spawnLeft = 0;
            const spawnRight = 220;
            const spawnTop = 140;
            const spawnBottom = 580;

            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = 'rgba(0, 0, 0, 1)';
            ctx.fillRect(0, cardAreaTop, W, H - cardAreaTop);
            ctx.fillRect(spawnLeft, spawnTop, spawnRight - spawnLeft, spawnBottom - spawnTop);
            ctx.globalCompositeOperation = 'source-over';

            ctx.strokeStyle = 'rgba(100, 220, 180, 0.8)';
            ctx.lineWidth = 3;
            const cardPulse = 1 + Math.sin(t * 3) * 0.02;
            ctx.strokeRect(4, cardAreaTop + 4, W - 8, H - cardAreaTop - 8);

            const spawnPulse = 1 + Math.sin(t * 2.5) * 0.03;
            ctx.strokeStyle = 'rgba(255, 215, 100, 0.9)';
            ctx.lineWidth = 4;
            ctx.strokeRect(spawnLeft + 4, spawnTop + 4, (spawnRight - spawnLeft - 8) * spawnPulse, (spawnBottom - spawnTop - 8) * spawnPulse);

            const arrowStartX = W / 2;
            const arrowStartY = cardAreaTop - 20;
            const arrowEndX = (spawnLeft + spawnRight) / 2;
            const arrowEndY = (spawnTop + spawnBottom) / 2;

            ctx.save();
            ctx.setLineDash([10, 10]);
            ctx.lineDashOffset = -t * 60;
            ctx.strokeStyle = 'rgba(255, 215, 100, 0.6)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(arrowStartX, arrowStartY);
            ctx.quadraticCurveTo(W / 2 - 100, cardAreaTop - 120, arrowEndX + 30, arrowEndY + 20);
            ctx.stroke();
            ctx.setLineDash([]);

            const flowProgress = (t * 0.8) % 1;
            const flowX = arrowStartX + (arrowEndX + 30 - arrowStartX) * flowProgress;
            const flowY = arrowStartY + (arrowEndY + 20 - arrowStartY) * flowProgress
                + Math.sin(flowProgress * Math.PI) * -40;
            ctx.fillStyle = 'rgba(255, 215, 100, 0.9)';
            ctx.beginPath();
            ctx.arc(flowX, flowY, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.font = 'bold 42px "Microsoft YaHei", sans-serif';
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
            ctx.shadowBlur = 15;
            ctx.fillText('第一步：布置灵物战士', W / 2, H / 2 - 80);
            ctx.shadowBlur = 0;

            ctx.font = '22px "Microsoft YaHei", sans-serif';
            ctx.fillStyle = 'rgba(220, 220, 220, 0.9)';
            ctx.fillText('拖动下方卡片到战场左侧放置', W / 2, H / 2 - 30);

            ctx.font = '16px "Microsoft YaHei", sans-serif';
            ctx.fillStyle = 'rgba(180, 180, 180, 0.6)';
            ctx.fillText('↓ 从这里拖出', W / 2, cardAreaTop - 40);

            ctx.font = '18px "Microsoft YaHei", sans-serif';
            ctx.fillStyle = 'rgba(255, 215, 100, 0.9)';
            ctx.fillText('→ 拖到这里', (spawnLeft + spawnRight) / 2, spawnBottom + 25);
        }

        renderStep2(ctx, W, H, t) {
            const orbAreaTop = 150;
            const orbAreaBottom = 560;
            const orbAreaLeft = 250;
            const orbAreaRight = 1000;

            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = 'rgba(0, 0, 0, 1)';
            ctx.fillRect(orbAreaLeft, orbAreaTop, orbAreaRight - orbAreaLeft, orbAreaBottom - orbAreaTop);
            ctx.globalCompositeOperation = 'source-over';

            ctx.strokeStyle = 'rgba(255, 215, 100, 0.8)';
            ctx.lineWidth = 3;
            ctx.strokeRect(orbAreaLeft + 4, orbAreaTop + 4, orbAreaRight - orbAreaLeft - 8, orbAreaBottom - orbAreaTop - 8);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.font = 'bold 44px "Microsoft YaHei", sans-serif';
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
            ctx.shadowBlur = 20;
            ctx.fillText('第二步：收集灵韵', W / 2, 70);
            ctx.shadowBlur = 0;

            ctx.font = 'bold 26px "Microsoft YaHei", sans-serif';
            ctx.fillStyle = '#ff7043';
            ctx.shadowColor = 'rgba(255, 112, 67, 0.4)';
            ctx.shadowBlur = 10;
            ctx.fillText('⚠ 否则灵韵将被敌人夺走！', W / 2, 125);
            ctx.shadowBlur = 0;

            ctx.font = '20px "Microsoft YaHei", sans-serif';
            ctx.fillStyle = 'rgba(220, 220, 220, 0.9)';
            ctx.fillText('点击战场上的金色灵韵球进行收集', W / 2, 170);

            const game = this.manager.game;
            if (game && game.orbs) {
                const activeOrbs = game.orbs.filter(o => !o.collected && !o.absorbed);
                if (activeOrbs.length > 0) {
                    const orb = activeOrbs[0];
                    const pulse = 1 + Math.sin(t * 4) * 0.15;
                    ctx.strokeStyle = 'rgba(255, 215, 100, 0.9)';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(orb.x, orb.y, 30 * pulse, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }

            if (this.step2Collected) {
                const sinceCollect = (this.elapsed - this.step2CollectTime) / 1000;
                const fadeIn = Math.min(1, sinceCollect / 0.3);
                ctx.globalAlpha = fadeIn;
                ctx.font = 'bold 36px "Microsoft YaHei", sans-serif';
                ctx.fillStyle = '#7CFFB2';
                ctx.shadowColor = 'rgba(124, 255, 178, 0.5)';
                ctx.shadowBlur = 20;
                ctx.fillText('✓ 收集成功！', W / 2, H / 2 - 20);
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1;
            }
        }

        handleClick(x, y) {}

        exit() {
            if (this.manager.game) {
                this.manager.game.tutorialMode = false;
                this.manager.game.enemyLingyun = 0;
            }
        }
    }

    class PlayingScene {
        constructor(manager) {
            this.manager = manager;
        }

        enter() {
            if (window.GameAudio && window.GameAudio.isInitialized()) {
                window.GameAudio.stopBGM();
                window.GameAudio.playBattle();
            }
            if (this.manager.game && !this.manager.game.isRunning) {
                this.manager.game.startBattle();
            }
        }

        update(dt) {}

        render(ctx) {}

        handleClick(x, y) {}

        exit() {
            if (window.GameAudio && window.GameAudio.isInitialized()) {
                window.GameAudio.stopBGM();
            }
            if (this.manager.game) {
                this.manager.game.stopBattle();
            }
        }
    }

    class EndingScene {
        constructor(manager) {
            this.manager = manager;
            this.elapsed = 0;
            this.phaseElapsed = 0;
            this.phase = 'intro';
            this.finished = false;

            this.panels = [
                { src: 'assets/ending/panel_01_museum_ext.jpg', duration: 2800, fx: 'none', caption: '' },
                { src: 'assets/ending/panel_02_hallway.jpg', duration: 3000, fx: 'mist', caption: '' },
                { src: 'assets/ending/panel_03_warriors_stop.jpg', duration: 2200, fx: 'none', caption: '' },
                { src: 'assets/ending/panel_04_chained.jpg', duration: 3500, fx: 'darkmist', caption: '' },
                { src: 'assets/ending/panel_05_dash.jpg', duration: 1600, fx: 'speedlines_shake', sfxText: '' },
                { src: 'assets/ending/panel_06_strike.jpg', duration: 1000, fx: 'flash_shake', sfxText: '锵！！' },
                { src: 'assets/ending/panel_07_shatter.jpg', duration: 2000, fx: 'debris_shake', sfxText: '咔嚓！' },
                { src: 'assets/ending/panel_08_awaken.jpg', duration: 3000, fx: 'redglow', caption: '' },
                { src: 'assets/ending/panel_09_hero_pose.jpg', duration: 3500, fx: 'heroglow', caption: '' },
            ];

            this.panelImages = [];
            this.panelsLoaded = false;
            this.currentPanel = -1;
            this.panelAlpha = 0;
            this.panelScale = 1;
            this.particles = [];
            this.burstParticles = [];
            this.shakeX = 0;
            this.shakeY = 0;
            this.shakeIntensity = 0;
            this.flashAlpha = 0;
            this.sfxTextAlpha = 0;
            this.sfxTextScale = 0.3;
            this.sfxTextContent = '';
            this.redGlowAlpha = 0;
            this.heroGlowAlpha = 0;
            this.speedLineAlpha = 0;
            this.borderAlpha = 0;
            this.zoomScale = 1;
            this.T_INTRO = 2500;
            this.T_PANEL_FADE = 500;
            this.T_CARD_ENTER = 800;
            this.T_CARD_HOLD = 4200;
            this.T_CARD_TOTAL = 5000;
            this.T_FINAL_FADE = 600;
            this.SKIP_HOLD_DURATION = 3000;
            this.pressStartTime = 0;
            this.isPressing = false;
            this.skipProgress = 0;
        }

        _preloadImages() {
            if (this.panelsLoaded) return;
            let loaded = 0;
            const total = this.panels.length;
            for (let i = 0; i < total; i++) {
                const img = new Image();
                img.onload = () => { loaded++; if (loaded >= total) this.panelsLoaded = true; };
                img.onerror = () => { loaded++; if (loaded >= total) this.panelsLoaded = true; };
                img.src = this.panels[i].src;
                this.panelImages[i] = img;
            }
        }

        enter() {
            this.elapsed = 0;
            this.phaseElapsed = 0;
            this.phase = 'intro';
            this.finished = false;
            this.currentPanel = -1;
            this.panelAlpha = 0;
            this.particles = [];
            this.burstParticles = [];
            this.shakeX = 0;
            this.shakeY = 0;
            this.shakeIntensity = 0;
            this.flashAlpha = 0;
            this.sfxTextAlpha = 0;
            this.sfxTextScale = 0.3;
            this.sfxTextContent = '';
            this.redGlowAlpha = 0;
            this.heroGlowAlpha = 0;
            this.speedLineAlpha = 0;
            this.borderAlpha = 0;
            this.zoomScale = 1;
            this.pressStartTime = 0;
            this.isPressing = false;
            this.skipProgress = 0;
            this.panelImages = [];
            this.panelsLoaded = false;

            if (window.GameAudio && window.GameAudio.isInitialized()) {
                window.GameAudio.stopBGM();
            }
            const endScreen = document.getElementById('end-screen');
            if (endScreen) endScreen.style.display = 'none';
            this.manager.showCutsceneCanvas();
            this._preloadImages();

            for (let i = 0; i < 40; i++) {
                this.particles.push({
                    x: Math.random() * 1280, y: Math.random() * 720,
                    size: 2 + Math.floor(Math.random() * 2) * 8,
                    alpha: 0.05 + Math.random() * 0.2,
                    speed: 0.05 + Math.random() * 0.15,
                    phase: Math.random() * Math.PI * 2,
                    color: Math.random() > 0.5 ? 'gold' : 'mist'
                });
            }
        }

        _advancePanel() {
            this.currentPanel++;
            if (this.currentPanel >= this.panels.length) {
                this.phase = 'whiteout';
                this.phaseElapsed = 0;
                this.shakeIntensity = 0;
                this.shakeX = 0;
                this.shakeY = 0;
                if (window.GameAudio && window.GameAudio.isInitialized()) {
                    window.GameAudio.playSfx('cardPop');
                }
                return;
            }
            this.phaseElapsed = 0;
            this.panelAlpha = 0;
            this.zoomScale = 1;
            this.borderAlpha = 0;
            const panel = this.panels[this.currentPanel];
            this.sfxTextContent = panel.sfxText || '';
            this.sfxTextAlpha = panel.sfxText ? 1 : 0;
            this.sfxTextScale = panel.sfxText ? 0.3 : 0;
            this.flashAlpha = panel.fx === 'flash_shake' ? 1 : 0;

            if (panel.fx === 'flash_shake' || panel.fx === 'speedlines_shake') {
                this.shakeIntensity = 18;
            } else if (panel.fx === 'debris_shake') {
                this.shakeIntensity = 8;
                this._spawnDebris();
            } else {
                this.shakeIntensity = 0;
            }
            if (panel.fx === 'flash_shake') {
                this._spawnBurstParticles(60, 'white');
            }
        }

        _spawnDebris() {
            for (let i = 0; i < 30; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 6;
                const sz = 2 + Math.floor(Math.random() * 3) * 8;
                this.burstParticles.push({
                    x: 640 + (Math.random() - 0.5) * 200, y: 360 + (Math.random() - 0.5) * 100,
                    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1,
                    size: sz, alpha: 1, decay: 0.4 + Math.random() * 0.8,
                    color: Math.random() > 0.5 ? 'gold' : 'bronze'
                });
            }
        }

        _spawnBurstParticles(count, colorType) {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 3 + Math.random() * 10;
                const sz = 2 + Math.floor(Math.random() * 3) * 8;
                this.burstParticles.push({
                    x: 640, y: 360,
                    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                    size: sz, alpha: 1, decay: 0.8 + Math.random() * 1.5,
                    color: colorType || (Math.random() > 0.4 ? 'gold' : 'white')
                });
            }
        }

        skipToCardPhase() {
            this.phase = 'card';
            this.phaseElapsed = 0;
            this.shakeIntensity = 0;
            this.shakeX = 0;
            this.shakeY = 0;
            this.flashAlpha = 0;
            this.sfxTextAlpha = 0;
            this.isPressing = false;
            this.skipProgress = 0;
            if (window.GameAudio && window.GameAudio.isInitialized()) {
                window.GameAudio.playSfx('cardPop');
            }
        }

        update(dt) {
            const dtSec = dt / 1000;
            this.elapsed += dt;
            this.phaseElapsed += dt;

            for (const p of this.particles) {
                p.y -= p.speed * dtSec * 60;
                p.phase += dtSec * 2;
                if (p.y < -10) { p.y = 730; p.x = Math.random() * 1280; }
            }
            for (let i = this.burstParticles.length - 1; i >= 0; i--) {
                const bp = this.burstParticles[i];
                bp.x += bp.vx * dtSec * 60;
                bp.y += bp.vy * dtSec * 60;
                bp.vy += 0.2 * dtSec * 60;
                bp.alpha -= bp.decay * dtSec;
                if (bp.alpha <= 0) this.burstParticles.splice(i, 1);
            }
            if (this.flashAlpha > 0) this.flashAlpha = Math.max(0, this.flashAlpha - dtSec * 5);
            if (this.sfxTextAlpha > 0) {
                this.sfxTextAlpha = Math.max(0, this.sfxTextAlpha - dtSec * 1.0);
                this.sfxTextScale = Math.min(1.5, this.sfxTextScale + dtSec * 4);
            }
            if (this.shakeIntensity > 0.1) {
                this.shakeX = Math.round((Math.random() - 0.5) * this.shakeIntensity * 2);
                this.shakeY = Math.round((Math.random() - 0.5) * this.shakeIntensity * 2);
                this.shakeIntensity = Math.max(0, this.shakeIntensity - dtSec * 12);
            } else { this.shakeX = 0; this.shakeY = 0; }

            if (this.isPressing && !this.finished && (this.phase === 'panel' || this.phase === 'intro')) {
                const pressDuration = this.elapsed - this.pressStartTime;
                this.skipProgress = clamp(pressDuration / this.SKIP_HOLD_DURATION, 0, 1);
                if (pressDuration >= this.SKIP_HOLD_DURATION) this.skipToCardPhase();
            }

            if (this.phase === 'intro') {
                const t = this.phaseElapsed / this.T_INTRO;
                if (t < 0.25) this.panelAlpha = easeOutCubic(t / 0.25);
                else if (t > 0.7) this.panelAlpha = easeInCubic((1 - t) / 0.3);
                else this.panelAlpha = 1;
                if (this.phaseElapsed >= this.T_INTRO) {
                    this.phase = 'panel';
                    this.phaseElapsed = 0;
                    this._advancePanel();
                }
            } else if (this.phase === 'panel') {
                if (this.currentPanel < 0) this._advancePanel();
                const panel = this.panels[this.currentPanel];
                if (!panel) return;
                const dur = panel.duration;
                const fadeIn = this.T_PANEL_FADE;
                const fadeOut = 400;
                const t = this.phaseElapsed;
                if (t < fadeIn) { this.panelAlpha = easeOutCubic(t / fadeIn); this.borderAlpha = easeOutCubic(t / fadeIn); }
                else if (t > dur - fadeOut) { this.panelAlpha = easeInCubic((dur - t) / fadeOut); }
                else { this.panelAlpha = 1; this.borderAlpha = 1; }

                if (panel.fx === 'heroglow') {
                    const glowT = clamp((t - fadeIn) / (dur - fadeIn - fadeOut), 0, 1);
                    this.heroGlowAlpha = Math.min(1, glowT * 1.5);
                    this.zoomScale = 1 + glowT * 0.05;
                } else { this.heroGlowAlpha = Math.max(0, this.heroGlowAlpha - dtSec * 2); }

                if (panel.fx === 'redglow') {
                    const glowT = clamp((t - fadeIn * 0.5) / (dur - fadeIn), 0, 1);
                    this.redGlowAlpha = glowT * 0.8;
                } else { this.redGlowAlpha = Math.max(0, this.redGlowAlpha - dtSec * 2); }

                if (panel.fx === 'speedlines_shake') { this.speedLineAlpha = Math.min(1, this.speedLineAlpha + dtSec * 4); }
                else { this.speedLineAlpha = Math.max(0, this.speedLineAlpha - dtSec * 3); }

                if (t >= dur) this._advancePanel();
            } else if (this.phase === 'whiteout') {
                if (this.phaseElapsed >= 300) { this.phase = 'card'; this.phaseElapsed = 0; }
            } else if (this.phase === 'card') {
                if (this.phaseElapsed >= this.T_CARD_TOTAL) { this.phase = 'finalfade'; this.phaseElapsed = 0; }
            } else if (this.phase === 'finalfade') {
                if (this.phaseElapsed >= this.T_FINAL_FADE && !this.finished) this.finishAnimation();
            }
        }

        finishAnimation() {
            if (this.finished) return;
            this.finished = true;
            this.manager.hideCutsceneCanvas();
            const endScreen = document.getElementById('end-screen');
            if (endScreen) endScreen.style.display = 'flex';
        }

        render(ctx) {
            const assets = this.manager.game ? this.manager.game.assets : null;
            ctx.save();
            ctx.imageSmoothingEnabled = false;

            if (this.phase === 'intro') {
                ctx.fillStyle = '#0a0810';
                ctx.fillRect(0, 0, 1280, 720);
                this.renderParticles(ctx);
                const alpha = this.panelAlpha;
                if (alpha > 0) {
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.font = 'bold 38px "STKaiti", "KaiTi", "楷体", serif';
                    ctx.fillStyle = '#c8b078';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'; ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 3;
                    ctx.fillText('流落海外的灵物，今夜归乡。', 640, 320);
                    ctx.font = '22px "VT323", "Courier New", monospace';
                    ctx.fillStyle = '#8a7a5a';
                    ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
                    ctx.fillText('THE SPIRITS RETURN HOME TONIGHT', 640, 380);
                    ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
                    ctx.restore();
                }
                this.renderSkipHint(ctx);
                this.renderVignette(ctx, 0.6);
            } else if (this.phase === 'panel') {
                ctx.translate(this.shakeX, this.shakeY);
                ctx.fillStyle = '#000';
                ctx.fillRect(-20, -20, 1320, 760);
                const panel = this.panels[this.currentPanel];
                const img = this.panelImages[this.currentPanel];
                if (img && img.complete && img.naturalWidth > 0) {
                    ctx.save();
                    ctx.globalAlpha = this.panelAlpha;
                    const zs = this.zoomScale;
                    if (zs !== 1) { ctx.translate(640, 360); ctx.scale(zs, zs); ctx.drawImage(img, -640, -360, 1280, 720); }
                    else { ctx.drawImage(img, 0, 0, 1280, 720); }
                    ctx.restore();
                } else {
                    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, 1280, 720);
                    if (!this.panelsLoaded) {
                        ctx.fillStyle = '#666'; ctx.font = '20px "VT323", monospace';
                        ctx.textAlign = 'center'; ctx.fillText('Loading...', 640, 360);
                    }
                }
                if (this.borderAlpha > 0) {
                    ctx.save();
                    ctx.strokeStyle = `rgba(218, 165, 32, ${this.borderAlpha * 0.6})`;
                    ctx.lineWidth = 6;
                    ctx.strokeRect(6, 6, 1268, 708);
                    ctx.strokeStyle = `rgba(218, 165, 32, ${this.borderAlpha * 0.3})`;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(14, 14, 1252, 692);
                    ctx.restore();
                }
                this.renderPanelFx(ctx, panel);
                this.renderParticles(ctx);
                this.renderBurstParticles(ctx);
                if (this.flashAlpha > 0) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
                    ctx.fillRect(-20, -20, 1320, 760);
                }
                this.renderSfxText(ctx);
                this.renderSpeedLines(ctx);
                this.renderSkipHint(ctx);
                this.renderVignette(ctx, 0.35);
            } else if (this.phase === 'whiteout') {
                const whiteT = this.phaseElapsed / 300;
                ctx.fillStyle = `rgba(255, 255, 255, ${easeInCubic(whiteT)})`;
                ctx.fillRect(0, 0, 1280, 720);
            } else if (this.phase === 'card') {
                ctx.translate(this.shakeX, this.shakeY);
                this.renderCardScene(ctx, assets);
                this.renderBurstParticles(ctx);
                this.renderParticles(ctx);
            } else if (this.phase === 'finalfade') {
                ctx.translate(this.shakeX, this.shakeY);
                this.renderCardScene(ctx, assets);
                this.renderBurstParticles(ctx);
                this.renderParticles(ctx);
                const fadeT = this.phaseElapsed / this.T_FINAL_FADE;
                ctx.fillStyle = `rgba(0, 0, 0, ${easeInOutCubic(fadeT)})`;
                ctx.fillRect(0, 0, 1280, 720);
            }
            ctx.restore();
        }

        renderPanelFx(ctx, panel) {
            if (!panel) return;
            if (panel.fx === 'heroglow' && this.heroGlowAlpha > 0) {
                const glowGrad = ctx.createRadialGradient(640, 280, 50, 640, 280, 500);
                glowGrad.addColorStop(0, `rgba(255, 240, 180, ${0.25 * this.heroGlowAlpha})`);
                glowGrad.addColorStop(0.4, `rgba(255, 200, 80, ${0.1 * this.heroGlowAlpha})`);
                glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = glowGrad; ctx.fillRect(0, 0, 1280, 720);
                if (this.phaseElapsed > panel.duration * 0.4) {
                    const textT = clamp((this.phaseElapsed - panel.duration * 0.4) / (panel.duration * 0.3), 0, 1);
                    ctx.save();
                    ctx.globalAlpha = textT * 0.9;
                    ctx.font = 'bold 56px "Press Start 2P", "VT323", "Courier New", monospace';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#ffd700';
                    ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 4;
                    ctx.fillText('FREE!', 640, 600);
                    ctx.font = 'bold 42px "STKaiti", "KaiTi", "楷体", serif';
                    ctx.fillStyle = 'rgba(255, 230, 100, 0.95)';
                    ctx.fillText('灵雾重归自由', 640, 660);
                    ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
                    ctx.restore();
                }
            }
            if (panel.fx === 'redglow' && this.redGlowAlpha > 0) {
                const eyeGrad = ctx.createRadialGradient(640, 300, 20, 640, 300, 350);
                eyeGrad.addColorStop(0, `rgba(255, 50, 30, ${0.5 * this.redGlowAlpha})`);
                eyeGrad.addColorStop(0.3, `rgba(180, 20, 10, ${0.2 * this.redGlowAlpha})`);
                eyeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = eyeGrad; ctx.fillRect(0, 0, 1280, 720);
            }
            if (panel.fx === 'darkmist') {
                const mistGrad = ctx.createRadialGradient(640, 360, 100, 640, 360, 500);
                mistGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
                mistGrad.addColorStop(0.5, 'rgba(20, 10, 30, 0.3)');
                mistGrad.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
                ctx.fillStyle = mistGrad; ctx.fillRect(0, 0, 1280, 720);
            }
            if (panel.fx === 'mist' || panel.fx === 'none') {
                const mistGrad = ctx.createLinearGradient(0, 0, 0, 720);
                mistGrad.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
                mistGrad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
                ctx.fillStyle = mistGrad; ctx.fillRect(0, 0, 1280, 720);
            }
        }

        renderSpeedLines(ctx) {
            if (this.speedLineAlpha <= 0) return;
            ctx.save();
            const cx = 640, cy = 360;
            const lineWidth = 6;
            const intensity = this.speedLineAlpha;
            ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.2})`;
            const numLines = 24;
            for (let i = 0; i < numLines; i++) {
                const angle = (i / numLines) * Math.PI * 2;
                const innerR = 150;
                const outerR = innerR + 200 + Math.random() * 150;
                const x1 = Math.round(cx + Math.cos(angle) * innerR);
                const y1 = Math.round(cy + Math.sin(angle) * innerR);
                const x2 = Math.round(cx + Math.cos(angle) * outerR);
                const y2 = Math.round(cy + Math.sin(angle) * outerR);
                ctx.fillRect(x1 - lineWidth/2, y1 - lineWidth/2, x2 - x1 + lineWidth, y2 - y1 + lineWidth);
            }
            ctx.restore();
        }

        renderSfxText(ctx) {
            if (this.sfxTextAlpha <= 0 || !this.sfxTextContent) return;
            ctx.save();
            ctx.translate(640, 260);
            ctx.scale(this.sfxTextScale, this.sfxTextScale);
            ctx.rotate(-0.12);
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.font = 'bold 96px "STKaiti", "KaiTi", "楷体", sans-serif';
            ctx.strokeStyle = `rgba(0, 0, 0, ${this.sfxTextAlpha})`;
            ctx.lineWidth = 10;
            ctx.strokeText(this.sfxTextContent, 0, 0);
            ctx.fillStyle = `rgba(255, 240, 50, ${this.sfxTextAlpha})`;
            ctx.fillText(this.sfxTextContent, 0, 0);
            ctx.restore();
        }

        renderBurstParticles(ctx) {
            for (const bp of this.burstParticles) {
                let c;
                if (bp.color === 'gold') c = `rgba(255, 215, 0, ${bp.alpha})`;
                else if (bp.color === 'bronze') c = `rgba(205, 140, 50, ${bp.alpha})`;
                else c = `rgba(255, 255, 255, ${bp.alpha})`;
                ctx.fillStyle = c;
                const sx = Math.round(bp.x), sy = Math.round(bp.y), sz = Math.round(bp.size);
                ctx.fillRect(sx, sy, sz, sz);
            }
        }

        renderVignette(ctx, intensity) {
            const v = ctx.createRadialGradient(640, 360, 200, 640, 360, 720);
            v.addColorStop(0, 'rgba(0, 0, 0, 0)');
            v.addColorStop(1, `rgba(0, 0, 0, ${intensity})`);
            ctx.fillStyle = v; ctx.fillRect(0, 0, 1280, 720);
        }

        renderCardScene(ctx, assets) {
            ctx.fillStyle = '#0f0c14'; ctx.fillRect(0, 0, 1280, 720);
            const bgGrad = ctx.createLinearGradient(0, 0, 0, 720);
            bgGrad.addColorStop(0, '#191423'); bgGrad.addColorStop(0.5, '#0f0c14'); bgGrad.addColorStop(1, '#0a080f');
            ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, 1280, 720);
            if (window.RelicArtifacts) {
                ctx.save(); ctx.globalAlpha = 0.08; ctx.imageSmoothingEnabled = false;
                const relicRot = Math.sin(this.elapsed / 2000) * 0.05;
                ctx.translate(640, 180); ctx.rotate(relicRot);
                window.RelicArtifacts.draw(ctx, 'shuangyang', 0, 0, 220);
                ctx.restore();
            }
            if (assets && window.CharacterCard) {
                const enterT = clamp(this.phaseElapsed / this.T_CARD_ENTER, 0, 1);
                const enterEase = easeOutBack(enterT);
                const w = Math.round(680 * enterEase);
                const h = Math.round(470 * enterEase);
                const x = Math.round(640 - w / 2);
                const y = Math.round(380 - h / 2);
                ctx.save(); ctx.globalAlpha = clamp(enterT * 2, 0, 1); ctx.imageSmoothingEnabled = false;
                window.CharacterCard.draw(ctx, 'shuangyang', x, y, w, h, assets, enterEase);
                ctx.restore();
                if (enterT > 0.7) {
                    const glowPulse = 0.3 + Math.sin(this.elapsed / 300) * 0.2;
                    ctx.save();
                    ctx.strokeStyle = `rgba(218, 165, 32, ${glowPulse})`;
                    ctx.lineWidth = 3; ctx.shadowColor = 'rgba(218, 165, 32, 0.8)'; ctx.shadowBlur = 0;
                    ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
                    ctx.restore();
                }
            }
            if (this.phaseElapsed > this.T_CARD_ENTER + 300) {
                const textAlpha = clamp((this.phaseElapsed - this.T_CARD_ENTER - 300) / 600, 0, 1);
                ctx.save();
                ctx.font = '32px "STKaiti", "KaiTi", "楷体", serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillStyle = `rgba(220, 200, 170, ${0.9 * textAlpha})`;
                ctx.fillText('Demo 结束 · 故事未完，敬请期待', 640, 640);
                ctx.restore();
            }
            this.renderVignette(ctx, 0.4);
        }

        renderParticles(ctx) {
            if (this.phase === 'whiteout') return;
            for (const p of this.particles) {
                const twinkle = 0.5 + 0.5 * Math.sin(p.phase);
                const alpha = p.alpha * twinkle;
                const px = Math.round(p.x), py = Math.round(p.y);
                let c;
                if (p.color === 'mist') c = `rgba(180, 170, 200, ${alpha * 0.5})`;
                else c = `rgba(255, 230, 150, ${alpha})`;
                ctx.fillStyle = c;
                const s = Math.max(2, Math.round(p.size / 8) * 8);
                ctx.fillRect(px - s/2, py - s/2, s, s);
            }
        }

        renderSkipHint(ctx) {
            if (this.elapsed < 1500 || this.finished) return;
            let alpha = clamp((this.elapsed - 1500) / 500, 0, 1);
            if (this.isPressing && this.skipProgress > 0) alpha = 1;
            else alpha *= 0.45;
            ctx.save();
            ctx.font = '14px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
            ctx.fillStyle = `rgba(220, 220, 220, ${alpha})`;
            ctx.fillText('长按跳过', 1260, 700);
            if (this.isPressing && this.skipProgress > 0) {
                const barW = 120, barH = 6;
                const barX = 1260 - barW, barY = 700 - 18;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.fillRect(barX, barY, barW, barH);
                const progressW = Math.round(barW * this.skipProgress);
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(barX, barY, progressW, barH);
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
                ctx.lineWidth = 1;
                ctx.strokeRect(barX, barY, barW, barH);
            }
            ctx.restore();
        }

        handleClick(x, y) {}
        handleMouseDown(x, y) {
            if (this.finished) return;
            if (this.phase !== 'panel' && this.phase !== 'intro') return;
            this.isPressing = true;
            this.pressStartTime = this.elapsed;
        }
        handleMouseUp(x, y) {
            this.isPressing = false;
            this.skipProgress = 0;
        }
        exit() {
            this.manager.hideCutsceneCanvas();
            this.particles = [];
            this.burstParticles = [];
            this.panelImages = [];
        }
    }

    window.SceneManager = SceneManager;
})();
