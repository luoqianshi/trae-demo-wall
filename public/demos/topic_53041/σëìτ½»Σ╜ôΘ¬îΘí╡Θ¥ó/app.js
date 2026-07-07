/**
 * Hi_Seven 高动效语音助手 - 核心逻辑
 * 模块：颗粒动画系统 / 语音识别 / API 客户端 / 配置管理 / 语音合成
 * 作者：Hi_Seven Team
 */

(() => {
    'use strict';

    /* ============================================================
     * 1. 工具函数
     * ============================================================ */
    const $ = (sel) => document.querySelector(sel);
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const rand = (min, max) => min + Math.random() * (max - min);

    /** 显示 toast 提示 */
    const toastEl = $('#toast');
    let toastTimer = null;
    function showToast(msg, duration = 2200) {
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove('show'), duration);
    }

    /* ============================================================
     * 2. 配置管理模块
     * ============================================================ */
    const STORAGE_KEY = 'hi_seven_config_v1';

    /** 服务商预设（OpenAI 兼容接口） */
    const PROVIDER_PRESETS = {
        deepseek:  { apiBase: 'https://api.deepseek.com/v1',    model: 'deepseek-chat' },
        qwen:      { apiBase: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
        glm:       { apiBase: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
        moonshot:  { apiBase: 'https://api.moonshot.cn/v1',     model: 'moonshot-v1-8k' },
        doubao:    { apiBase: 'https://ark.cn-beijing.volces.com/api/v3', model: 'doubao-pro-32k' },
        custom:    { apiBase: '',                                model: '' }
    };

    const DEFAULT_CONFIG = {
        provider: 'deepseek',
        apiKey: '',
        apiBase: PROVIDER_PRESETS.deepseek.apiBase,
        model: PROVIDER_PRESETS.deepseek.model,
        temperature: 0.7,
        maxTokens: 1024,
        systemPrompt: '你是 Hi Seven，一个高动效语音助手。回答简洁、富有科技感。',
        tts: true,
        ttsEngine: 'edge',       // 语音引擎：edge（Edge TTS 神经网络）/ browser（浏览器本地）
        edgeVoiceFemale: 'zh-CN-XiaoxiaoNeural', // Edge TTS 女声音色（晓晓·最自然）
        edgeVoiceMale: 'zh-CN-YunxiNeural',      // Edge TTS 男声音色（云希·最自然）
        voiceGender: 'female',   // 语音性别：female / male
        voiceRate: 1.0,          // 语音速率（0.5-2）
        voicePitch: 1.0,         // 语音音调（0-2）
        showSystemStats: false,  // 是否显示电脑运行状态
        wakeWord: true,          // 是否启用唤醒词检测（Hi Seven / 你好小七）
        sttLang: 'mixed'         // 语音识别语言：zh-CN / en-US / mixed（中英文混合）
    };

    const ConfigManager = {
        data: { ...DEFAULT_CONFIG },

        /** 从 localStorage 加载配置 */
        load() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (raw) {
                    this.data = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
                }
            } catch (e) {
                console.warn('配置加载失败:', e);
            }
            return this.data;
        },

        /** 保存配置到 localStorage */
        save() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
                return true;
            } catch (e) {
                console.error('配置保存失败:', e);
                return false;
            }
        },

        /** 重置为默认配置 */
        reset() {
            this.data = { ...DEFAULT_CONFIG };
            this.save();
        },

        /** 应用服务商预设 */
        applyPreset(provider) {
            const preset = PROVIDER_PRESETS[provider];
            if (preset) {
                this.data.provider = provider;
                if (preset.apiBase) this.data.apiBase = preset.apiBase;
                if (preset.model) this.data.model = preset.model;
            }
        }
    };

    /* ============================================================
     * 3. 颗粒动画系统
     * ============================================================ */

    /** 单个粒子 */
    class Particle {
        constructor(x, y, target) {
            this.x = x;
            this.y = y;
            this.tx = target.x;
            this.ty = target.y;
            this.vx = 0;
            this.vy = 0;
            this.size = rand(1.2, 2.6);
            this.hue = rand(260, 320); // 紫色到品红
            this.alpha = rand(0.5, 1);
            this.life = 1;
            this.trail = [];
            this.maxTrail = 6;
            this.depth = 0; // 3D 深度值，用于近大远小
        }

        /** 更新粒子位置 */
        update(volume, energy) {
            // 向目标点弹性靠拢
            const dx = this.tx - this.x;
            const dy = this.ty - this.y;
            const stiffness = 0.06;
            const damping = 0.82;
            this.vx = (this.vx + dx * stiffness) * damping;
            this.vy = (this.vy + dy * stiffness) * damping;

            // 受音量驱动的随机扰动
            const noise = volume * 18 + energy * 6;
            this.vx += (Math.random() - 0.5) * noise;
            this.vy += (Math.random() - 0.5) * noise;

            this.x += this.vx;
            this.y += this.vy;

            // 拖尾
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > this.maxTrail) this.trail.shift();
        }

        /** 绘制粒子（根据深度调整大小与透明度，营造立体感） */
        draw(ctx) {
            // 深度因子：近大远小、近亮远暗
            const depthFactor = clamp((this.depth + 2) / 4, 0.35, 1.3);
            const size = this.size * depthFactor;
            const alpha = this.alpha * clamp(depthFactor, 0.4, 1);

            // 远处/极暗粒子跳过昂贵的辉光渐变与拖尾，仅画核心点（性能优化）
            if (alpha < 0.18) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${this.hue}, 100%, 85%, ${alpha})`;
                ctx.fill();
                return;
            }

            // 拖尾
            for (let i = 0; i < this.trail.length; i++) {
                const t = this.trail[i];
                const a = (i / this.trail.length) * alpha * 0.4;
                ctx.beginPath();
                ctx.arc(t.x, t.y, size * (i / this.trail.length), 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${this.hue}, 90%, 65%, ${a})`;
                ctx.fill();
            }
            // 主体（带辉光）
            const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, size * 4);
            grad.addColorStop(0, `hsla(${this.hue}, 95%, 75%, ${alpha})`);
            grad.addColorStop(0.4, `hsla(${this.hue}, 90%, 60%, ${alpha * 0.5})`);
            grad.addColorStop(1, `hsla(${this.hue}, 90%, 50%, 0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, size * 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${this.hue}, 100%, 85%, ${alpha})`;
            ctx.fill();
        }
    }

    /** 颗粒动画系统：3D 立体智能体核心（球体 + 环带 + 自由粒子） */
    class ParticleSystem {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.particles = [];
            this.targets = [];
            this.volume = 0;        // 当前音量 0-1
            this.smoothVolume = 0;  // 平滑后的音量
            this.energy = 0;        // 累积能量
            this.state = 'idle';    // idle / listening / thinking / speaking
            this.stateTime = 0;
            this.dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.mouseX = 0;
            this.mouseY = 0;
            this.rotY = 0;          // Y 轴旋转角度
            this.rotX = 0;          // X 轴旋转角度

            this.resize();
            this.generateAgent();
            this.bindEvents();
            this.lastTime = performance.now();
            this.loop = this.loop.bind(this);
            requestAnimationFrame(this.loop);
        }

        bindEvents() {
            window.addEventListener('resize', () => {
                this.resize();
                this.generateAgent();
            });
            window.addEventListener('mousemove', (e) => {
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
            });
        }

        resize() {
            const w = window.innerWidth;
            const h = window.innerHeight;
            this.canvas.width = w * this.dpr;
            this.canvas.height = h * this.dpr;
            this.canvas.style.width = w + 'px';
            this.canvas.style.height = h + 'px';
            this.ctx.scale(this.dpr, this.dpr);
            this.w = w;
            this.h = h;
        }

        /** 生成 3D 智能体核心目标点（球面 + 双环带 + 自由粒子） */
        generateAgent() {
            const targets = [];
            const sphereCount = 260;

            // 核心球面 - 斐波那契球面均匀分布
            for (let i = 0; i < sphereCount; i++) {
                const y = 1 - (i / (sphereCount - 1)) * 2; // y 从 1 到 -1
                const radius = Math.sqrt(Math.max(0, 1 - y * y));
                const theta = Math.PI * (1 + Math.sqrt(5)) * i; // 黄金角
                targets.push({
                    x3: Math.cos(theta) * radius,
                    y3: y,
                    z3: Math.sin(theta) * radius,
                    role: 'sphere',
                    idx: i
                });
            }

            // 环带 1（赤道环）
            const ring1Count = 90;
            for (let i = 0; i < ring1Count; i++) {
                const a = (i / ring1Count) * Math.PI * 2;
                targets.push({
                    x3: Math.cos(a) * 1.35,
                    y3: 0,
                    z3: Math.sin(a) * 1.35,
                    role: 'ring',
                    ring: 0,
                    idx: i
                });
            }

            // 环带 2（倾斜 60 度环）
            const ring2Count = 90;
            const tilt = Math.PI / 3;
            for (let i = 0; i < ring2Count; i++) {
                const a = (i / ring2Count) * Math.PI * 2;
                const x = Math.cos(a) * 1.55;
                const z = Math.sin(a) * 1.55;
                targets.push({
                    x3: x,
                    y3: z * Math.sin(tilt),
                    z3: z * Math.cos(tilt),
                    role: 'ring',
                    ring: 1,
                    idx: i
                });
            }

            // 自由游走粒子（轨道运动）
            for (let i = 0; i < 50; i++) {
                targets.push({
                    x3: 0, y3: 0, z3: 0,
                    role: 'free',
                    idx: i,
                    speed: rand(0.4, 1.2),
                    phase: rand(0, Math.PI * 2),
                    phaseY: rand(0, Math.PI * 2)
                });
            }

            this.targets = targets;

            // 同步粒子数量
            const cx = this.w / 2;
            const cy = this.h / 2;
            while (this.particles.length < targets.length) {
                this.particles.push(new Particle(cx + rand(-200, 200), cy + rand(-200, 200), targets[this.particles.length]));
            }
            if (this.particles.length > targets.length) {
                this.particles.length = targets.length;
            }
            // 重新绑定目标
            this.particles.forEach((p, i) => {
                p.tx = targets[i].x;
                p.ty = targets[i].y;
                p.role = targets[i].role;
            });
        }

        /** 3D 点旋转 + 透视投影到 2D 屏幕 */
        project(x3, y3, z3, rotY, rotX, cx, cy, scale) {
            // Y 轴旋转
            const x1 = x3 * Math.cos(rotY) + z3 * Math.sin(rotY);
            const z1 = -x3 * Math.sin(rotY) + z3 * Math.cos(rotY);
            const y1 = y3;
            // X 轴旋转
            const y2 = y1 * Math.cos(rotX) - z1 * Math.sin(rotX);
            const z2 = y1 * Math.sin(rotX) + z1 * Math.cos(rotX);
            // 透视投影
            const persp = 3.5;
            const depth = Math.max(0.1, persp + z2);
            const projScale = (persp / depth) * scale;
            return {
                x: cx + x1 * projScale,
                y: cy + y2 * projScale,
                depth: z2
            };
        }

        /** 设置状态 */
        setState(state) {
            this.state = state;
            this.stateTime = 0;
        }

        /** 设置音量 */
        setVolume(v) {
            this.volume = clamp(v, 0, 1);
        }

        /** 主循环 */
        loop(now) {
            const dt = (now - this.lastTime) / 16.67;
            this.lastTime = now;
            this.stateTime += dt;

            // 平滑音量
            this.smoothVolume = lerp(this.smoothVolume, this.volume, 0.15);
            this.energy = this.energy * 0.96 + this.smoothVolume * 0.04;

            this.update(dt);
            this.draw();
            requestAnimationFrame(this.loop);
        }

        update(dt) {
            const cx = this.w / 2;
            const cy = this.h / 2;
            const t = this.stateTime;
            const scale = Math.min(this.w, this.h) * 0.16;

            // 状态驱动的旋转速度
            let rotSpeed = 0.008;
            if (this.state === 'listening') rotSpeed = 0.018;
            else if (this.state === 'thinking') rotSpeed = 0.005;
            else if (this.state === 'speaking') rotSpeed = 0.022;

            this.rotY += rotSpeed * dt;
            this.rotX = Math.sin(t * 0.004) * 0.25 + this.smoothVolume * 0.1;

            const stateHue = this.getStateHue();

            this.particles.forEach((p, i) => {
                const target = this.targets[i];
                let x3 = target.x3;
                let y3 = target.y3;
                let z3 = target.z3;

                if (target.role === 'sphere') {
                    // 球面呼吸 + 音量脉动
                    const pulse = 1 + this.smoothVolume * 0.18 + Math.sin(t * 0.03 + target.idx * 0.1) * 0.04;
                    x3 *= pulse;
                    y3 *= pulse;
                    z3 *= pulse;
                    // 思考状态：球面波动
                    if (this.state === 'thinking') {
                        const wave = Math.sin(t * 0.08 + target.idx * 0.3) * 0.08;
                        x3 *= (1 + wave);
                        y3 *= (1 + wave);
                        z3 *= (1 + wave);
                    }
                } else if (target.role === 'ring') {
                    // 环带自旋（两条环带反向旋转）
                    const ringRot = t * (target.ring === 0 ? 0.025 : -0.02);
                    const cosR = Math.cos(ringRot);
                    const sinR = Math.sin(ringRot);
                    const nx = x3 * cosR - z3 * sinR;
                    const nz = x3 * sinR + z3 * cosR;
                    x3 = nx;
                    z3 = nz;
                    // 音量扩张
                    const expand = 1 + this.smoothVolume * 0.25;
                    x3 *= expand;
                    z3 *= expand;
                    if (target.ring === 1) y3 *= expand;
                } else if (target.role === 'free') {
                    // 自由粒子轨道运动
                    const a = t * 0.02 * target.speed + target.phase;
                    const r = 1.9 + Math.sin(t * 0.03 + target.phase) * 0.4 + this.smoothVolume * 0.6;
                    x3 = Math.cos(a) * r;
                    y3 = Math.sin(a * 0.7 + target.phaseY) * r * 0.85;
                    z3 = Math.sin(a) * r;
                }

                // 3D 旋转 + 透视投影
                const proj = this.project(x3, y3, z3, this.rotY, this.rotX, cx, cy, scale);
                p.tx = proj.x;
                p.ty = proj.y;
                p.depth = proj.depth;

                // 状态驱动颜色（环带略偏色相）
                p.hue = stateHue + (target.role === 'ring' ? 20 : 0) + (i % 10) * 2;

                p.update(this.smoothVolume, this.energy);
            });
        }

        draw() {
            const ctx = this.ctx;
            // 拖影背景
            ctx.fillStyle = 'rgba(5, 3, 13, 0.18)';
            ctx.fillRect(0, 0, this.w, this.h);

            // 中心光晕
            const cx = this.w / 2;
            const cy = this.h / 2;
            const glowR = 200 + this.smoothVolume * 140;
            const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
            const stateColor = this.getStateColor();
            glow.addColorStop(0, `${stateColor}33`);
            glow.addColorStop(0.5, `${stateColor}11`);
            glow.addColorStop(1, `${stateColor}00`);
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
            ctx.fill();

            // 中心核心光球（智能体能量核）
            const coreR = 30 + this.smoothVolume * 25 + Math.sin(this.stateTime * 0.05) * 4;
            const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
            coreGrad.addColorStop(0, `${stateColor}cc`);
            coreGrad.addColorStop(0.5, `${stateColor}44`);
            coreGrad.addColorStop(1, `${stateColor}00`);
            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
            ctx.fill();

            // 粒子（加性混合，结果与绘制顺序无关，故免排序以降低每帧开销）
            ctx.globalCompositeOperation = 'lighter';
            const particles = this.particles;
            for (let i = 0, n = particles.length; i < n; i++) {
                particles[i].draw(ctx);
            }
            ctx.globalCompositeOperation = 'source-over';

            // 状态扫描线
            if (this.state === 'listening' || this.state === 'speaking') {
                const scanY = (this.stateTime * 2) % this.h;
                const scanGrad = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 60);
                scanGrad.addColorStop(0, `${stateColor}00`);
                scanGrad.addColorStop(0.5, `${stateColor}22`);
                scanGrad.addColorStop(1, `${stateColor}00`);
                ctx.fillStyle = scanGrad;
                ctx.fillRect(0, scanY - 60, this.w, 120);
            }
        }

        /** 状态对应的色相值 */
        getStateHue() {
            switch (this.state) {
                case 'listening': return 185; // 青色
                case 'thinking':  return 275; // 紫色
                case 'speaking':  return 200; // 蓝色
                default:          return 285; // 紫品
            }
        }

        getStateColor() {
            switch (this.state) {
                case 'listening': return '#22d3ee';
                case 'thinking':  return '#a855f7';
                case 'speaking':  return '#38bdf8';
                default:          return '#6B21A8';
            }
        }
    }

    /* ============================================================
     * 3.5 星空背景模块（科技感环境：闪烁星点 + 偶发流星）
     * ============================================================ */
    class StarField {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.stars = [];
            this.shootingStars = [];
            this.dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.lastTime = performance.now();
            this.lastShooting = 0;
            this.nextShootingDelay = rand(4000, 9000);

            this.resize();
            this.generate();
            // 预渲染白色辉光精灵，供近层星点复用，避免每帧创建径向渐变（性能优化）
            this.glowSprite = this._makeGlowSprite();
            window.addEventListener('resize', () => {
                this.resize();
                this.generate();
            });
            this.loop = this.loop.bind(this);
            requestAnimationFrame(this.loop);
        }

        /** 创建可复用的白色径向辉光精灵 */
        _makeGlowSprite() {
            const c = document.createElement('canvas');
            c.width = c.height = 64;
            const cx = c.getContext('2d');
            const g = cx.createRadialGradient(32, 32, 0, 32, 32, 32);
            g.addColorStop(0, 'rgba(220, 230, 255, 1)');
            g.addColorStop(1, 'rgba(220, 230, 255, 0)');
            cx.fillStyle = g;
            cx.fillRect(0, 0, 64, 64);
            return c;
        }

        resize() {
            const w = window.innerWidth;
            const h = window.innerHeight;
            this.canvas.width = w * this.dpr;
            this.canvas.height = h * this.dpr;
            this.canvas.style.width = w + 'px';
            this.canvas.style.height = h + 'px';
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.scale(this.dpr, this.dpr);
            this.w = w;
            this.h = h;
        }

        /** 生成星点（按密度自适应数量，分三层营造纵深） */
        generate() {
            const count = Math.floor((this.w * this.h) / 4500);
            this.stars = [];
            for (let i = 0; i < count; i++) {
                const layer = Math.random() < 0.6 ? 0 : (Math.random() < 0.7 ? 1 : 2);
                this.stars.push({
                    x: Math.random() * this.w,
                    y: Math.random() * this.h,
                    // 远层小而暗，近层大而亮
                    size: layer === 0 ? rand(0.4, 0.9) : layer === 1 ? rand(0.8, 1.5) : rand(1.4, 2.4),
                    baseAlpha: layer === 0 ? rand(0.25, 0.5) : layer === 1 ? rand(0.45, 0.75) : rand(0.7, 1),
                    twinkleSpeed: rand(0.4, 1.6),
                    phase: rand(0, Math.PI * 2),
                    hue: Math.random() < 0.15 ? rand(200, 280) : null, // 少量带色星点
                    layer
                });
            }
        }

        /** 生成一颗流星 */
        spawnShootingStar() {
            const fromLeft = Math.random() < 0.5;
            const startY = rand(0, this.h * 0.5);
            this.shootingStars.push({
                x: fromLeft ? -50 : this.w + 50,
                y: startY,
                vx: (fromLeft ? 1 : -1) * rand(8, 14),
                vy: rand(3, 6),
                len: rand(80, 160),
                life: 1
            });
        }

        loop(now) {
            const dt = (now - this.lastTime) / 16.67;
            this.lastTime = now;
            this.update(dt, now);
            this.draw();
            requestAnimationFrame(this.loop);
        }

        update(dt, now) {
            // 偶发流星（按固定间隔触发，触发后重新随机下一次间隔）
            if (now - this.lastShooting > this.nextShootingDelay) {
                this.spawnShootingStar();
                this.lastShooting = now;
                this.nextShootingDelay = rand(4000, 9000);
            }
            // 更新流星
            for (let i = this.shootingStars.length - 1; i >= 0; i--) {
                const s = this.shootingStars[i];
                s.x += s.vx * dt;
                s.y += s.vy * dt;
                s.life -= 0.012 * dt;
                if (s.life <= 0 || s.x < -100 || s.x > this.w + 100 || s.y > this.h + 100) {
                    this.shootingStars.splice(i, 1);
                }
            }
        }

        draw() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.w, this.h);
            const t = this.lastTime / 1000;

            // 星点
            for (const s of this.stars) {
                const twinkle = 0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.phase);
                const alpha = s.baseAlpha * (0.4 + twinkle * 0.6);
                const color = s.hue !== null
                    ? `hsla(${s.hue}, 80%, 80%, ${alpha})`
                    : `rgba(220, 230, 255, ${alpha})`;

                // 近层星点带辉光
                if (s.layer === 2) {
                    const r = s.size * 4;
                    if (s.hue === null) {
                        // 白色星点：复用预渲染辉光精灵，免每帧创建渐变（性能优化）
                        ctx.globalAlpha = alpha;
                        ctx.drawImage(this.glowSprite, s.x - r, s.y - r, r * 2, r * 2);
                        ctx.globalAlpha = 1;
                    } else {
                        // 少量带色星点：保留原渐变绘制以保持色相
                        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
                        grad.addColorStop(0, color);
                        grad.addColorStop(1, 'rgba(220, 230, 255, 0)');
                        ctx.fillStyle = grad;
                        ctx.beginPath();
                        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }

                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
            }

            // 流星
            for (const s of this.shootingStars) {
                const tailX = s.x - s.vx * (s.len / 12);
                const tailY = s.y - s.vy * (s.len / 12);
                const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
                grad.addColorStop(0, 'rgba(168, 85, 247, 0)');
                grad.addColorStop(0.6, `rgba(168, 85, 247, ${s.life * 0.5})`);
                grad.addColorStop(1, `rgba(220, 230, 255, ${s.life})`);
                ctx.strokeStyle = grad;
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(tailX, tailY);
                ctx.lineTo(s.x, s.y);
                ctx.stroke();

                // 流星头部高光
                ctx.beginPath();
                ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${s.life})`;
                ctx.fill();
            }
        }
    }

    /* ============================================================
     * 3.6 系统状态监控模块（CPU / 内存 / 存储）
     *      浏览器能力有限，采用以下策略：
     *      - CPU：通过测量主线程繁忙度（rAF 间隔抖动）估算占用率
     *      - 内存：performance.memory（Chrome）JS 堆占用 / 设备内存
     *      - 存储：navigator.storage.estimate() 配额与用量
     * ============================================================ */
    class SystemMonitor {
        constructor() {
            this.running = false;
            this.timer = null;
            this.cpuCores = navigator.hardwareConcurrency || 0;
            this.deviceMem = navigator.deviceMemory || 0; // GB，近似值
            this.lastFrame = 0;
            this.busyRatio = 0;        // 主线程繁忙度（0-1）
            this.memUsageGB = 0;
            this.memTotalGB = 0;       // JS 堆上限或设备内存近似
            this.diskUsageGB = 0;
            this.diskQuotaGB = 0;
            this.storageSupported = !!(navigator.storage && navigator.storage.estimate);
            this.onUpdate = null;
            this.lastStats = null;     // 后端返回的真实数据
            this.backendOk = false;    // 后端是否可用
        }

        /** 启动监控，每秒采样一次并回调 */
        start() {
            if (this.running) return;
            this.running = true;
            this.lastFrame = performance.now();
            this.busyRatio = 0;
            // rAF 持续采样主线程繁忙度
            this.rafLoop();
            // 每秒汇总一次并刷新 UI
            this.timer = setInterval(() => this.sample(), 1000);
            this.sample();
        }

        /** 停止监控 */
        stop() {
            this.running = false;
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
        }

        /** rAF 循环：通过帧间隔抖动估算主线程繁忙度 */
        rafLoop() {
            if (!this.running) return;
            const now = performance.now();
            const delta = now - this.lastFrame;
            this.lastFrame = now;
            // 理想 16.67ms，超出部分视为繁忙（指数平滑）
            if (delta > 0) {
            const busy = clamp((delta - 16.67) / 50, 0, 1);
            this.busyRatio = this.busyRatio * 0.8 + busy * 0.2;
            }
            requestAnimationFrame(() => this.rafLoop());
        }

        /** 采集一次数据并触发回调（优先从后端获取真实系统数据） */
        async sample() {
            // 尝试从后端接口获取真实数据
            try {
                const resp = await fetch('/api/system-stats', { cache: 'no-store' });
                if (resp.ok) {
                    const data = await resp.json();
                    if (data && !data.error) {
                        this.lastStats = data;
                        this.backendOk = true;
                        this.onUpdate && this.onUpdate(this.getSnapshot());
                        return;
                    }
                }
                this.backendOk = false;
            } catch (e) {
                this.backendOk = false;
            }

            // 后端不可用时使用浏览器 API 采集（原有逻辑保留）
            if (performance.memory) {
                const m = performance.memory;
                this.memUsageGB = m.usedJSHeapSize / 1073741824;
                this.memTotalGB = m.jsHeapSizeLimit / 1073741824;
            } else if (this.deviceMem) {
                this.memTotalGB = this.deviceMem;
                this.memUsageGB = this.deviceMem * 0.4;
            }
            if (this.storageSupported) {
                try {
                    const est = await navigator.storage.estimate();
                    this.diskUsageGB = (est.usage || 0) / 1073741824;
                    this.diskQuotaGB = (est.quota || 0) / 1073741824;
                } catch (e) {
                    // 忽略存储读取错误
                }
            }
            this.onUpdate && this.onUpdate(this.getSnapshot());
        }

        /** 获取当前快照（后端数据优先，否则使用浏览器估算） */
        getSnapshot() {
            // 后端真实数据
            if (this.backendOk && this.lastStats) {
                return {
                    cpu: {
                        percent: clamp(this.lastStats.cpu.percent, 0, 100),
                        cores: this.lastStats.cpu.cores,
                        freqMHz: this.lastStats.cpu.freqMHz || 0
                    },
                    mem: {
                        percent: clamp(this.lastStats.mem.percent, 0, 100),
                        used: this.lastStats.mem.used,
                        total: this.lastStats.mem.total
                    },
                    disk: {
                        percent: clamp(this.lastStats.disk.percent, 0, 100),
                        used: this.lastStats.disk.used,
                        total: this.lastStats.disk.total
                    }
                };
            }

            // 浏览器估算（原有逻辑）
            const cpuPercent = clamp(this.busyRatio * 100 + rand(2, 8), 0, 100);
            const memPercent = this.memTotalGB > 0
                ? clamp((this.memUsageGB / this.memTotalGB) * 100, 0, 100)
                : 0;
            const diskPercent = this.diskQuotaGB > 0
                ? clamp((this.diskUsageGB / this.diskQuotaGB) * 100, 0, 100)
                : 0;

            return {
                cpu: {
                    percent: cpuPercent,
                    cores: this.cpuCores,
                    freqMHz: 0
                },
                mem: {
                    percent: memPercent,
                    used: this.memUsageGB,
                    total: this.memTotalGB
                },
                disk: {
                    percent: diskPercent,
                    used: this.diskUsageGB,
                    total: this.diskQuotaGB
                }
            };
        }
    }

    /* ============================================================
     * 4. 语音识别模块
     * ============================================================ */
    class SpeechRecognizer {
        constructor(onResult, onEnd, onError) {
            this.recognition = null;
            this.onResult = onResult;
            this.onEnd = onEnd;
            this.onError = onError;
            this.listening = false;
            this.finalText = '';
            this.lang = 'zh-CN';     // 当前识别语言（默认中文，支持中英文混合）
            this.sttMode = 'mixed';  // 识别模式：zh-CN / en-US / mixed

            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SR) {
                this.recognition = new SR();
                // 中英文混合模式下使用 zh-CN：Chrome 中文识别器对中英文混合有原生支持
                this.recognition.lang = this.lang;
                this.recognition.continuous = false;
                this.recognition.interimResults = true;
                this.recognition.onresult = (e) => this.handleResult(e);
                this.recognition.onend = () => this.handleEnd();
                this.recognition.onerror = (e) => this.onError && this.onError(e.error);
            }
        }

        get supported() { return !!this.recognition; }

        /** 设置识别模式：zh-CN / en-US / mixed */
        setMode(mode) {
            this.sttMode = mode || 'mixed';
            // mixed 模式使用 zh-CN（中文识别器对中英文混合支持最好）
            // en-US 模式使用英文识别器
            // zh-CN 模式纯中文识别
            if (this.sttMode === 'en-US') {
                this.lang = 'en-US';
            } else {
                // mixed 和 zh-CN 都使用中文识别器
                this.lang = 'zh-CN';
            }
            if (this.recognition) {
                this.recognition.lang = this.lang;
            }
        }

        handleResult(e) {
            let interim = '';
            this.finalText = '';
            for (let i = 0; i < e.results.length; i++) {
                const r = e.results[i];
                if (r.isFinal) this.finalText += r[0].transcript;
                else interim += r[0].transcript;
            }
            // mixed 模式下进行中英文混合后处理
            const combined = this.finalText + interim;
            const processed = this.sttMode === 'mixed' ? this.postProcessMixed(combined) : combined;
            this.onResult && this.onResult(processed, !!this.finalText);
        }

        /**
         * 中英文混合识别后处理：
         * Chrome 的 zh-CN 识别器会将英文音译为中文，这里还原常见英文词
         */
        postProcessMixed(text) {
            if (!text) return text;
            let result = text;
            // 常见英文单词的中文音译还原表
            const phoneticMap = {
                '塞文': 'seven',
                '赛文': 'seven',
                '嗨': 'hi',
                '嘿': 'hey',
                '泰明诺': 'terminal',
                '泰米诺': 'terminal',
                '特尔米诺': 'terminal',
                '德斯科': 'desktop',
                '德斯克托': 'desktop',
                '拜斯': 'base',
                '佛德': 'folder',
                '福特': 'folder',
                '法尔德': 'folder',
                '法伊尔': 'file',
                '发伊尔': 'file',
                '费尔': 'file',
                '波尔': 'port',
                '阿皮艾': 'api',
                '阿皮伊': 'api',
                '杰松': 'json',
                '杰森': 'json',
                '亚马儿': 'yaml',
                '亚木': 'yaml',
                '皮奇': 'pypi',
                '皮普伊': 'pip',
                '康达': 'conda',
                '多克': 'docker',
                '吉特': 'git',
                '吉特哈布': 'github',
                '吉特胡布': 'github',
                '纳诺': 'nano',
                '维姆': 'vim',
                '埃马克斯': 'emacs',
                '萨多': 'sudo',
                '林那克斯': 'linux',
                '林克斯': 'linux',
                '麦克': 'mac',
                '欧艾斯': 'os',
                '皮艾奇皮': 'php',
                '阿斯克': 'ascii',
                '尤阿尔尔': 'url',
                '尤里': 'uri',
                '埃斯奇艾尔': 'sql',
                '思酷艾尔': 'sql',
                '塞帕': 'cyber',
                '阿艾': 'ai',
                '皮迪艾夫': 'pdf',
                '皮恩吉': 'png',
                '杰佩吉': 'jpg',
                '杰佩艾吉': 'jpeg',
                // 优化：补充更多常见英文词汇的中文音译还原（中英文混合识别增强）
                '欧喷艾': 'openai',
                '欧喷阿伊': 'openai',
                '吉皮提': 'gpt',
                '吉皮蒂': 'gpt',
                '埃尔艾尔': 'llm',
                '艾尔艾尔': 'llm',
                '克劳德': 'claude',
                '克罗德': 'claude',
                '安斯罗皮克': 'anthropic',
                '杰米尼': 'gemini',
                '吉米尼': 'gemini',
                '查特': 'chat',
                '恰特': 'chat',
                '科德': 'code',
                '柯德': 'code',
                '阿普': 'app',
                '艾普': 'app',
                '韦伯': 'web',
                '威伯': 'web',
                '德塔': 'data',
                '达塔': 'data',
                '瑟维尔': 'server',
                '塞维尔': 'server',
                '克莱恩特': 'client',
                '克赖恩特': 'client',
                '贾瓦': 'java',
                '加瓦': 'java',
                '贾瓦斯克里普特': 'javascript',
                '加瓦斯克里普特': 'javascript',
                '泰普斯克里普特': 'typescript',
                '雷阿克特': 'react',
                '瑞阿克特': 'react',
                '维尤': 'vue',
                '诺德': 'node',
                '迪诺': 'deno',
                '安古拉': 'angular',
                '哈尔罗': 'hello',
                '哈罗': 'hello',
                '沃德': 'world',
                '沃尔德': 'world',
                '韦尔康姆': 'welcome',
                '埃克塞尔': 'excel',
                '桑德': 'sound'
            };
            // 按词长度降序替换，避免短词覆盖长词
            const keys = Object.keys(phoneticMap).sort((a, b) => b.length - a.length);
            for (const key of keys) {
                const val = phoneticMap[key];
                if (result.includes(key)) {
                    result = result.replace(new RegExp(key, 'g'), val);
                }
            }
            return result;
        }

        handleEnd() {
            this.listening = false;
            this.onEnd && this.onEnd(this.finalText);
            this.finalText = '';
        }

        start() {
            if (!this.recognition) {
                this.onError && this.onError('unsupported');
                return false;
            }
            // 已在监听则不重复启动
            if (this.listening) return true;
            try {
                this.recognition.start();
                this.listening = true;
                return true;
            } catch (e) {
                const msg = e.message || '';
                // "Recognition is being started or already started"
                // 识别器上一次还未完全释放，等待后重试一次
                if (msg.includes('already started') || msg.includes('being started')) {
                    console.warn('[识别] 识别器未就绪，300ms 后重试');
                    setTimeout(() => {
                        if (this.listening) return;
                        try {
                            this.recognition.start();
                            this.listening = true;
                        } catch (e2) {
                            this.onError && this.onError(e2.message);
                        }
                    }, 300);
                    return true;
                }
                this.onError && this.onError(msg);
                return false;
            }
        }

        stop() {
            if (this.recognition && this.listening) {
                // 立即标记为非监听状态，避免 stop() 异步回调期间状态不一致
                // 导致 toggleListen 误判（如点击停止时识别器仍认为在监听）
                this.listening = false;
                try { this.recognition.stop(); } catch (e) {}
            }
        }
    }

    /* ============================================================
     * 4.5 唤醒词检测模块（免费方案：Web Speech API 持续识别）
     * ============================================================ */
    /**
     * 唤醒词检测器：利用浏览器内置的 SpeechRecognition 进行持续语音识别，
     * 当检测到 "Hi Seven" 或 "你好小七" 关键词时触发回调。
     * 免费、无需任何 API Key，仅依赖 Chrome 内核浏览器的 Web Speech API。
     *
     * 设计要点：
     * 1. 使用中文识别器（zh-CN）同时支持 "hi seven"（英文）与 "你好小七"（中文）
     *    Chrome 中文识别器对中英文混合有原生支持，英文识别器无法识别中文唤醒词
     * 2. 放宽匹配规则：同时支持英文 seven 与中文"小七/赛文"等变体
     * 3. Chrome 要求用户手势后才能启动 SpeechRecognition
     * 4. 实时显示识别内容到状态栏，便于用户验证是否工作
     */
    class WakeWordDetector {
        constructor(onWake) {
            this.recognition = null;
            this.onWake = onWake;       // 检测到唤醒词时的回调
            this.enabled = false;       // 是否启用（用户配置）
            this.running = false;       // 是否正在运行
            this.activated = false;     // 是否已通过用户手势激活（浏览器要求）
            this.restartTimer = null;   // 自动重启定时器
            this.onDebug = null;        // 调试回调，参数为识别到的文字

            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SR) {
                this.recognition = new SR();
                // 关键：使用中文识别器，同时支持"hi seven"和"你好小七"
                // 中文识别器对中英文混合有原生支持，且可还原英文音译
                this.recognition.lang = 'zh-CN';
                this.recognition.continuous = true;   // 持续识别
                this.recognition.interimResults = true;
                this.recognition.onresult = (e) => this.handleResult(e);
                this.recognition.onend = () => this.handleEnd();
                this.recognition.onerror = (e) => this.handleError(e);
            }
        }

        get supported() { return !!this.recognition; }

        /**
         * 判断文本是否包含唤醒词
         * 支持两类唤醒词：
         *   1. 英文："hi seven" / "hello seven"
         *   2. 中文："你好小七" / "你好小7" / "嗨小七"
         * 优化策略：
         *   - 中文识别器（zh-CN）可能将英文音译为中文，需同时匹配中英文变体
         *   - 短文本单独匹配核心词（seven/小七）即可触发
         *   - 长文本需要前缀（hi/你好）+ 核心词双重确认，避免误触发
         */
        isWakeWord(text) {
            if (!text) return false;
            const lower = text.toLowerCase().trim();

            // ===== 核心词：seven 的英文及中文音译变体 =====
            // 中文识别器（zh-CN）会返回英文原词或中文音译，需全覆盖
            const sevenPatterns = [
                // 英文 seven 的常见误识别变体（发音近似）
                'seven', 'sevan', 'severn', 'sevin',
                'seventh', 'savon', 'sevon', 'sean', 'kevin',
                'seton', 'setten', 'seaton', 'sutton',
                'savan', 'siven', 'setin', 'seatin', 'saten',
                '11', '7', 'sevn', 'seve',
                // hi seven 易被识别为 hi silent（高频误识别）
                'silent', 'silence', 'silen', 'silant', 'salent',
                'cilent', 'cylent', 'sylen', 'sylent', 'sylence',
                'cylen', 'silnt', 'sient', 'sillent'
            ];
            // seven 的中文音译变体（zh-CN 识别器返回）
            const sevenChinesePatterns = [
                '赛文', '塞文', '赛温', '塞温', '赛万',
                '赛恩', '塞恩', '赛维', '塞维',
                '色文', '色温', '瑟文', '瑟温',
                '赛门', '塞门'
            ];

            // ===== 核心词：小七 的中文变体 =====
            // "你好小七" 中 "小七" 的各种发音近似
            const xiaoqiPatterns = [
                '小七', '小7', '小期', '小齐', '小奇',
                '小琪', '小旗', '小棋', '小启', '小企',
                '小气', '小器', '晓七', '晓7', '晓期',
                '小柒', '晓柒'
            ];

            // ===== 前缀词：hi / hey / 你好 / 嗨 =====
            const hiPatterns = ['hi', 'hey', 'hai', 'high', 'he', 'ay'];
            // 中文前缀"你好"的变体
            const helloChinesePatterns = [
                '你好', '您好', '你好啊', '您好啊',
                '嗨', '嘿', '哈喽', '哈罗'
            ];

            const hasSeven = sevenPatterns.some(p => lower.includes(p));
            const hasSevenChinese = sevenChinesePatterns.some(p => text.includes(p));
            const hasSevenAny = hasSeven || hasSevenChinese;

            const hasXiaoqi = xiaoqiPatterns.some(p => text.includes(p));

            const hasHi = hiPatterns.some(p => {
                // 词边界匹配，避免 "this" 包含 "hi"
                return new RegExp('\\b' + p + '\\b', 'i').test(lower);
            });
            const hasHelloChinese = helloChinesePatterns.some(p => text.includes(p));
            const hasPrefixAny = hasHi || hasHelloChinese;

            // 核心词命中（seven 或 小七 任一）
            const hasCoreWord = hasSevenAny || hasXiaoqi;

            // 规则1：同时包含前缀词和核心词（最可靠）
            if (hasCoreWord && hasPrefixAny) return true;

            // 规则2：英文 "hi seven" / "hey seven" 紧密相连变体
            if (/hi.?seven/i.test(lower)) return true;
            if (/hey.?seven/i.test(lower)) return true;
            if (/hi.?sil/i.test(lower)) return true;
            if (/hey.?sil/i.test(lower)) return true;
            if (/high.?sil/i.test(lower)) return true;

            // 规则3：中文 "你好小七" / "嗨小七" / "你好赛文" 紧密相连变体
            if (/你好.?小七/.test(text)) return true;
            if (/您好.?小七/.test(text)) return true;
            if (/嗨.?小七/.test(text)) return true;
            if (/你好.?赛文/.test(text)) return true;
            if (/嗨.?赛文/.test(text)) return true;
            if (/你好.?小7/.test(text)) return true;

            // 规则4：短文本中单独包含核心词即触发
            // 长度 <= 15，避免在长句中误触发
            if (hasSevenAny && lower.length <= 15) return true;
            if (hasXiaoqi && text.length <= 15) return true;

            // 规则5：中文短文本单独包含中文 seven 变体
            if (hasSevenChinese && text.length <= 10) return true;

            return false;
        }

        handleResult(e) {
            // 只检查最新结果，避免重复触发
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const transcript = e.results[i][0].transcript;
                // 调试输出：实时显示识别到的内容
                this.onDebug && this.onDebug(transcript);
                console.log('[唤醒词检测] 识别到:', transcript);

                if (this.isWakeWord(transcript)) {
                    console.log('[唤醒词检测] 命中唤醒词！');
                    // 检测到唤醒词，立即停止检测并触发回调
                    this.enabled = false;
                    this.stop();
                    this.onWake && this.onWake();
                    return;
                }
            }
        }

        handleEnd() {
            this.running = false;
            // 浏览器会自动停止识别，若仍处于启用状态且已激活则自动重启
            if (this.enabled && this.activated) {
                this.restartTimer = setTimeout(() => this.startInternal(), 300);
            }
        }

        handleError(e) {
            // 错误时 onend 也会触发，无需额外处理；
            // "no-speech" 和 "aborted" 是正常情况
            if (e.error !== 'no-speech' && e.error !== 'aborted') {
                console.warn('[唤醒词检测] 错误:', e.error);
            }
            // 麦克风权限被拒绝或服务不可用时，停止自动重启避免无限循环
            if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                this.activated = false;
                this.onDebug && this.onDebug('麦克风权限被拒绝');
            }
        }

        /** 标记已获得用户手势激活（浏览器要求 SpeechRecognition 必须在用户交互后启动） */
        activate() {
            this.activated = true;
        }

        /** 启动唤醒词检测（外部调用，需先调用 activate 激活） */
        start() {
            if (!this.recognition) return;
            this.enabled = true;
            // 若尚未通过用户手势激活，则等待激活后再启动
            if (!this.activated) return;
            this.startInternal();
        }

        /** 内部启动方法（自动重启时调用） */
        startInternal() {
            if (!this.recognition || this.running || !this.enabled || !this.activated) return;
            try {
                this.recognition.start();
                this.running = true;
                console.log('[唤醒词检测] 已启动，请说 "Hi Seven" 或 "你好小七"');
                this.onDebug && this.onDebug('检测中...');
            } catch (e) {
                // 启动失败（可能上一次还未完全停止），稍后重试
                this.restartTimer = setTimeout(() => this.startInternal(), 1000);
            }
        }

        /** 停止唤醒词检测 */
        stop() {
            this.enabled = false;
            if (this.restartTimer) {
                clearTimeout(this.restartTimer);
                this.restartTimer = null;
            }
            if (this.recognition && this.running) {
                try { this.recognition.stop(); } catch (e) {}
            }
        }
    }

    /* ============================================================
     * 5. 音量分析模块（AudioContext + AnalyserNode）
     * ============================================================ */
    class VolumeAnalyser {
        constructor() {
            this.ctx = null;
            this.analyser = null;
            this.stream = null;
            this.dataArray = null;
            this.running = false;
            this.rafId = null;
            this.onLevel = null;
        }

        async start() {
            try {
                this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
                this.analyser = this.ctx.createAnalyser();
                this.analyser.fftSize = 512;
                this.analyser.smoothingTimeConstant = 0.6;
                const source = this.ctx.createMediaStreamSource(this.stream);
                source.connect(this.analyser);
                this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
                this.running = true;
                this.tick();
                return true;
            } catch (e) {
                console.error('麦克风访问失败:', e);
                return false;
            }
        }

        tick() {
            if (!this.running) return;
            this.analyser.getByteFrequencyData(this.dataArray);
            // 计算平均音量
            let sum = 0;
            for (let i = 0; i < this.dataArray.length; i++) sum += this.dataArray[i];
            const avg = sum / this.dataArray.length / 255;
            this.onLevel && this.onLevel(avg);
            this.rafId = requestAnimationFrame(() => this.tick());
        }

        stop() {
            this.running = false;
            if (this.rafId) cancelAnimationFrame(this.rafId);
            if (this.stream) {
                this.stream.getTracks().forEach(t => t.stop());
                this.stream = null;
            }
            if (this.ctx) {
                try { this.ctx.close(); } catch (e) {}
                this.ctx = null;
            }
            this.onLevel && this.onLevel(0);
        }
    }

    /* ============================================================
     * 6. API 客户端模块（OpenAI 兼容，支持流式）
     * ============================================================ */
    class ApiClient {
        constructor(config) {
            this.config = config;
        }

        setConfig(config) { this.config = config; }

        /**
         * 发送聊天请求（流式）
         * @param {Array<{role:string,content:string}>} messages
         * @param {(chunk:string)=>void} onChunk 流式回调
         * @returns {Promise<string>} 完整回复
         */
        async chat(messages, onChunk) {
            const { apiBase, apiKey, model, temperature, maxTokens } = this.config;
            if (!apiKey) throw new Error('未配置 API Key');
            if (!apiBase) throw new Error('未配置 API Base URL');

            const url = apiBase.replace(/\/$/, '') + '/chat/completions';
            const body = {
                model: model || 'gpt-3.5-turbo',
                messages,
                temperature: Number(temperature) || 0.7,
                max_tokens: Number(maxTokens) || 1024,
                stream: true
            };

            const resp = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(body)
            });

            if (!resp.ok) {
                const errText = await resp.text().catch(() => '');
                throw new Error(`API 请求失败 (${resp.status}): ${errText.slice(0, 200)}`);
            }

            // 流式解析 SSE
            const reader = resp.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            let full = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith('data:')) continue;
                    const data = trimmed.slice(5).trim();
                    if (data === '[DONE]') return full;
                    try {
                        const json = JSON.parse(data);
                        const delta = json.choices?.[0]?.delta?.content || '';
                        if (delta) {
                            full += delta;
                            onChunk && onChunk(delta);
                        }
                    } catch (e) {
                        // 忽略解析错误
                    }
                }
            }
            return full;
        }
    }

    /* ============================================================
     * 6.5 Agent 路由模块（问题分类 + 联网能力）
     * ============================================================ */
    /**
     * Agent 路由器：对用户输入进行分类，按类别执行不同流程
     * 分类：
     *   - system:  系统操作（查看/打开文件、管理进程等）→ 走系统指令流程
     *   - search:  联网查询（最新信息、未知知识）→ 先搜索再回答
     *   - chat:    普通对话（闲聊、写作、翻译等）→ 直接 AI 回复
     */
    class AgentRouter {
        constructor() {
            // 系统操作关键词（命中任一即归类为 system）
            this.systemKeywords = [
                '查看文件', '打开文件', '读取文件', '显示文件', '查看代码',
                '打开应用', '启动应用', '关闭应用', '退出应用',
                '查看进程', '杀进程', '结束进程', '查看内存', '查看cpu',
                '查看磁盘', '查看网络', '查看端口', '查看目录', '列出文件',
                '查看系统', '系统信息', '运行命令', '执行命令', '终端',
                '清空对话', '清空记录', '关闭电脑状态', '清空系统控制',
                // 英文关键词
                'open file', 'read file', 'view file', 'show file',
                'open app', 'launch app', 'kill process', 'list files',
                'run command', 'execute command', 'terminal',
                'clear chat', 'clear history'
            ];
            // 联网查询关键词（命中任一即归类为 search）
            this.searchKeywords = [
                '最新', '今天', '昨天', '近期', '最近', '现在',
                '新闻', '天气', '股价', '汇率', '比赛', '赛事',
                '搜索', '查一下', '查询', '联网', '网上',
                '什么是', '是怎么回事', '为什么会',
                'who is', 'what is', 'latest', 'today', 'yesterday',
                'news', 'weather', 'search', 'look up', 'find out',
                'current', 'recent', 'now', 'price of', 'stock'
            ];
        }

        /**
         * 对用户输入进行分类
         * @param {string} text 用户输入
         * @returns {'system'|'search'|'chat'} 分类结果
         */
        classify(text) {
            if (!text) return 'chat';
            const lower = text.toLowerCase();
            const trimmed = text.trim();

            // 1. 优先检测系统操作（系统操作通常包含明确的动作词）
            for (const kw of this.systemKeywords) {
                if (lower.includes(kw.toLowerCase())) return 'system';
            }

            // 2. 检测联网查询需求
            for (const kw of this.searchKeywords) {
                if (lower.includes(kw.toLowerCase())) return 'search';
            }

            // 3. 默认普通对话
            return 'chat';
        }

        /**
         * 调用后端联网搜索接口
         * @param {string} query 搜索关键词
         * @returns {Promise<{success:boolean, results:Array, error:string}>}
         */
        async search(query) {
            try {
                const resp = await fetch('/api/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query })
                });
                if (!resp.ok) {
                    return { success: false, results: [], error: `搜索请求失败 (${resp.status})` };
                }
                const data = await resp.json();
                return {
                    success: !!data.success,
                    results: data.results || [],
                    error: data.error || ''
                };
            } catch (e) {
                return { success: false, results: [], error: '搜索请求异常: ' + e.message };
            }
        }

        /**
         * 将搜索结果格式化为可注入 AI 上下文的文本
         * @param {Array} results 搜索结果数组
         * @returns {string} 格式化后的上下文文本
         */
        formatSearchContext(results) {
            if (!results || results.length === 0) return '';
            const lines = ['【联网搜索结果】'];
            results.forEach((r, i) => {
                lines.push(`${i + 1}. ${r.title}`);
                if (r.snippet) lines.push(`   ${r.snippet}`);
                if (r.url) lines.push(`   来源: ${r.url}`);
            });
            lines.push('请基于以上搜索结果回答用户问题，如信息不足可结合自身知识补充。');
            return lines.join('\n');
        }
    }

    /* ============================================================
     * 7. 语音合成模块
     * ============================================================ */
    class SpeechSynth {
        constructor() {
            this.supported = 'speechSynthesis' in window;
            this.voice = null;
            this.gender = 'female';   // 当前选择的性别
            this.rate = 1.0;          // 速率
            this.pitch = 1.0;         // 音调
            this.engine = 'edge'; // 当前引擎
            this.config = null;       // 由 App 注入的完整配置引用
            this.onLevel = null;      // 在线音频音量回调（驱动动画）
            this.audioCtx = null;     // 在线播放用的 AudioContext
            this.seAnalyser = null;   // 在线音频分析器
            this.seSource = null;     // 当前播放的 BufferSourceNode
            this.seRafId = null;      // 音量分析 RAF ID
            this.seData = null;       // 分析器数据缓冲
            this.stopped = false;     // 是否已停止（中断播放循环）
            this._onEndCallback = null; // 当前播放结束回调
            this._interrupted = false;  // 是否被外部中断（唤醒词打断）
            if (this.supported) {
                this.loadVoice();
                speechSynthesis.onvoiceschanged = () => this.loadVoice();
            }
        }

        /** Edge TTS 可选音色（微软 Azure 神经网络语音，按性别分组，均为中文）
         *  吐字清晰、韵律自然 */
        static EDGE_VOICES = {
            female: [
                { value: 'zh-CN-XiaoxiaoNeural',  label: '晓晓 Xiaoxiao — 神经网络女声（最自然·推荐）' },
                { value: 'zh-CN-XiaoyiNeural',    label: '晓伊 Xiaoyi — 神经网络女声（温柔）' },
                { value: 'zh-CN-XiaochenNeural',  label: '晓辰 Xiaochen — 神经网络女声（清亮）' },
                { value: 'zh-CN-XiaohanNeural',   label: '晓涵 Xiaohan — 神经网络女声（温暖）' },
                { value: 'zh-CN-XiaomengNeural',  label: '晓梦 Xiaomeng — 神经网络女声（亲切）' },
                { value: 'zh-CN-XiaoruiNeural',   label: '晓睿 Xiaorui — 神经网络女声（沉稳）' }
            ],
            male: [
                { value: 'zh-CN-YunxiNeural',     label: '云希 Yunxi — 神经网络男声（最自然·推荐）' },
                { value: 'zh-CN-YunyangNeural',   label: '云扬 Yunyang — 神经网络男声（播音腔）' },
                { value: 'zh-CN-YunjianNeural',   label: '云健 Yunjian — 神经网络男声（叙述感）' },
                { value: 'zh-CN-YunfengNeural',   label: '云枫 Yunfeng — 神经网络男声（沉稳）' },
                { value: 'zh-CN-YunhaoNeural',    label: '云皓 Yunhao — 神经网络男声（清朗）' },
                { value: 'zh-CN-YunzeNeural',     label: '云泽 Yunze — 神经网络男声（成熟）' }
            ]
        };

        /** 已知中文语音的性别特征（用于浏览器 TTS 按性别筛选更具科技感/真人感的音色） */
        static VOICE_GENDER_HINTS = {
            // 女声特征名
            female: [
                'Ting-Ting', 'Tingting', 'Mei-Jia', 'Meijia', 'Sin-Ji', 'Sinji',
                'Huihui', 'Yaoyao', 'Xiaoxiao', 'Xiaoyi', 'Xiaochen', 'Xiaohan',
                'Xiaomeng', 'Xiaoqiu', 'Xiaorui', 'Xiaoshuang', 'Xiaoyan',
                'Zhiyu', 'Sunhi', 'Luli', 'female', 'woman'
            ],
            // 男声特征名
            male: [
                'Kangkang', 'Yunyang', 'Yunjian', 'Yunxi', 'Yunxia', 'Yunfeng',
                'Yunze', 'Yunhao', 'Yunye', 'male', 'man'
            ]
        };

        /** 判断语音名称属于哪个性别，无法判断返回 null */
        detectGender(voice) {
            if (!voice) return null;
            const name = (voice.name || '') + ' ' + (voice.voiceURI || '');
            const lower = name.toLowerCase();
            // 先匹配男声特征（避免 Yunxi 等被女声误判）
            for (const key of SpeechSynth.VOICE_GENDER_HINTS.male) {
                if (lower.includes(key.toLowerCase())) return 'male';
            }
            for (const key of SpeechSynth.VOICE_GENDER_HINTS.female) {
                if (lower.includes(key.toLowerCase())) return 'female';
            }
            return null;
        }

        loadVoice() {
            const voices = speechSynthesis.getVoices();
            if (!voices.length) return;
            // 优先按性别匹配中文语音，其次任意中文语音，最后兜底第一个
            this.voice = this.pickVoiceByGender(voices, this.gender)
                      || voices.find(v => /zh(-|_)?CN/i.test(v.lang))
                      || voices.find(v => /zh/i.test(v.lang))
                      || voices[0];
        }

        /** 按性别挑选最具科技感/真人感的中文语音 */
        pickVoiceByGender(voices, gender) {
            const zhVoices = voices.filter(v => /zh/i.test(v.lang));
            const pool = zhVoices.length ? zhVoices : voices;
            // 优先选择本地服务语音（音质更自然）
            const localFirst = pool.find(v => v.localService);
            const detected = pool.find(v => this.detectGender(v) === gender);
            // 优先级：性别匹配的本地语音 > 性别匹配任意 > 本地语音 > 第一个中文
            return detected || localFirst || pool[0];
        }

        /** 设置语音性别，并重新挑选合适的音色 */
        setGender(gender) {
            this.gender = (gender === 'male') ? 'male' : 'female';
            if (this.supported) this.loadVoice();
        }

        /** 设置速率与音调（科技感/真人感微调） */
        setProsody(rate, pitch) {
            this.rate = clamp(Number(rate) || 1.0, 0.5, 2.0);
            // 根据性别对音调做轻微偏移，让女声更清亮、男声更低沉
            const base = this.gender === 'male' ? 0.9 : 1.05;
            this.pitch = clamp((Number(pitch) || 1.0) * base, 0, 2.0);
        }

        /** 设置语音引擎 */
        setEngine(engine) {
            if (engine === 'browser') this.engine = 'browser';
            else this.engine = 'edge';
        }

        /** 获取当前性别对应的 Edge TTS 音色名 */
        getEdgeVoice() {
            if (!this.config) return this.gender === 'male' ? 'zh-CN-YunxiNeural' : 'zh-CN-XiaoxiaoNeural';
            return this.gender === 'male'
                ? (this.config.edgeVoiceMale || 'zh-CN-YunxiNeural')
                : (this.config.edgeVoiceFemale || 'zh-CN-XiaoxiaoNeural');
        }

        /** 将前端语速（0.5-1.5）转换为 Edge TTS 语速格式（如 "+0%"、"-20%"） */
        formatEdgeRate(rate) {
            const pct = Math.round((rate - 1) * 100);
            return (pct >= 0 ? '+' : '') + pct + '%';
        }

        /** 将前端音调（0-2）转换为 Edge TTS 音调格式（如 "+0Hz"、"-10Hz"） */
        formatEdgePitch(pitch) {
            const hz = Math.round((pitch - 1) * 50);
            return (hz >= 0 ? '+' : '') + hz + 'Hz';
        }

        /**
         * 过滤文本中的特殊符号，只保留文字、英文、数字和必要标点
         * 移除 markdown 符号（_ * # ` ~ | > - 等）及代码标记
         */
        stripSymbols(text) {
            if (!text) return text;
            let result = text;
            // 移除 markdown 代码块标记
            result = result.replace(/```[\s\S]*?```/g, '');
            // 移除行内代码标记
            result = result.replace(/`([^`]*)`/g, '$1');
            // 移除 markdown 标题符号
            result = result.replace(/^#{1,6}\s*/gm, '');
            // 移除 markdown 强调符号（_ ** __ ~ ~~ 等）
            result = result.replace(/\*\*\*?/g, '');
            result = result.replace(/___?/g, '');
            result = result.replace(/~~~/g, '');
            result = result.replace(/~~/g, '');
            // 移除 markdown 链接/图片语法，保留显示文本
            result = result.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');
            result = result.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
            // 移除 markdown 列表符号
            result = result.replace(/^[\s]*[-*+]\s+/gm, '');
            result = result.replace(/^[\s]*\d+\.\s+/gm, '');
            // 移除 markdown 引用块符号
            result = result.replace(/^>\s*/gm, '');
            // 移除 markdown 表格分隔符
            result = result.replace(/\|/g, ' ');
            // 移除 markdown 水平分割线
            result = result.replace(/^[-*_]{3,}$/gm, '');
            // 移除指令标记（<<SYS_CMD>> 等）
            result = result.replace(/<<[A-Z_]+>>/g, '');
            result = result.replace(/<<END_[A-Z_]+>>/g, '');
            // 移除剩余的特殊符号（保留有语义的符号，过滤纯格式符号）
            // 保留：
            //   - 中英文文字、数字
            //   - 中文标点 \u3000-\u303f、全角字符 \uff00-\uffef
            //   - 基本英文标点 . , ! ? ; : ' " ( ) - /
            //   - 有语义符号：℃ ° % ± × ÷ · • … — – ~ @ # $ ¥ € £ & + = < > ^ ℃
            result = result.replace(
                /[^a-zA-Z0-9\u4e00-\u9fff\u3000-\u303f\uff00-\uffef\s.,!?;:'"()\-\/%°℃±×÷·•…—–~@#$¥€£&+=<>^]/g,
                ''
            );
            // 合并多余空格
            result = result.replace(/[ \t]{2,}/g, ' ');
            // 合并多余换行
            result = result.replace(/\n{3,}/g, '\n\n');
            return result.trim();
        }

        /** 将长文本按标点切分为短句，避免单次请求过长导致突兀断裂 */
        splitSentences(text) {
            // 按中文句末标点、换行、英文句号切分，保留标点
            const parts = text.match(/[^。！？；\n.!?]+[。！？；\n.!?]*/g) || [text];
            // 过滤空白句，合并过短片段（少于 4 字的拼到上一句）
            const result = [];
            for (const p of parts) {
                const t = p.trim();
                if (!t) continue;
                if (result.length && t.length < 4) {
                    result[result.length - 1] += t;
                } else {
                    result.push(t);
                }
            }
            return result.length ? result : [text];
        }

        /** 长文本截断：超过4行或80字只保留第一句话 */
        _truncateForTTS(text) {
            if (!text) return text;
            const lines = text.split('\n').filter(l => l.trim());
            const charCount = text.replace(/\s/g, '').length;
            // 未超过阈值，全部播报
            if (lines.length <= 4 && charCount <= 80) return text;
            // 超过阈值，只取第一句
            const firstLine = lines[0] || text;
            // 遇到中文句号、感叹号、问号、分号处截断
            const match = firstLine.match(/^([^。！？；!?;：:]+)[。！？；!?;::]/);
            if (match) {
                return match[1] + match[0].charAt(match[0].length - 1);
            }
            // 没有标点则取第一行
            return firstLine;
        }

        /** 主入口：根据引擎分发 */
        async speak(text, onEnd) {
            if (!text) { onEnd && onEnd(); return; }
            // 过滤特殊符号，只保留文字、英文、数字和必要标点
            text = this.stripSymbols(text);
            if (!text || !text.trim()) { onEnd && onEnd(); return; }
            // 长文本截断：仅浏览器本地 TTS 需要（macOS 上长文本会被截断）
            // Edge 引擎已通过 splitSentences + 预取流水线处理长文本，完整播报
            if (this.engine === 'browser') {
                text = this._truncateForTTS(text);
            }
            if (!text || !text.trim()) { onEnd && onEnd(); return; }
            this.stop();
            this.stopped = false;
            this._interrupted = false;
            this._onEndCallback = onEnd || null;
            try {
                if (this.engine === 'edge') {
                    await this.speakEdge(text, onEnd);
                } else {
                    this.speakBrowser(text, onEnd);
                }
            } catch (e) {
                // TTS 出错时仍要回调，避免应用卡在"语音输出中"状态
                console.error('[TTS] 播放失败:', e);
                this.stopSEAnalysis();
                if (!this._interrupted) {
                    this._onEndCallback && this._onEndCallback();
                }
                this._onEndCallback = null;
            }
        }

        /** Edge TTS（本地后端代理 Azure 神经网络语音）：按句切分 + 预取下一句，保证连贯
         *  吐字清晰、韵律自然 */
        async speakEdge(text, onEnd) {
            const sentences = this.splitSentences(text);
            // 过滤掉空句子，避免请求空文本导致卡住
            const validSentences = sentences.filter(s => s && s.trim());
            if (validSentences.length === 0) {
                onEnd && onEnd();
                return;
            }
            const voice = this.getEdgeVoice();
            const rate = this.formatEdgeRate(this.rate);
            const pitch = this.formatEdgePitch(this.pitch);
            // 初始化音频上下文与分析器
            // 若 audioCtx 已关闭（closed）则重建，否则 resume
            if (!this.audioCtx || this.audioCtx.state === 'closed') {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                console.log('[TTS] 创建新的 AudioContext');
            }
            // Chrome 会在 AudioContext 长时间不活动时自动 suspend，
            // 必须先 resume 才能正常播放；resume 后再次校验状态
            if (this.audioCtx.state !== 'running') {
                try {
                    await this.audioCtx.resume();
                } catch (e) {
                    console.warn('[TTS] audioCtx.resume 失败:', e.message);
                }
                // resume 后仍然不是 running，则重建 audioCtx 作为兜底
                if (this.audioCtx.state !== 'running') {
                    console.warn('[TTS] audioCtx 仍为', this.audioCtx.state, '，重建 AudioContext');
                    try { this.audioCtx.close(); } catch (e) {}
                    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    try { await this.audioCtx.resume(); } catch (e) {}
                }
            }
            console.log('[TTS] audioCtx 状态:', this.audioCtx.state);
            this.seAnalyser = this.audioCtx.createAnalyser();
            this.seAnalyser.fftSize = 512;
            this.seAnalyser.smoothingTimeConstant = 0.6;
            this.seData = new Uint8Array(this.seAnalyser.frequencyBinCount);
            this.seAnalyser.connect(this.audioCtx.destination);
            this.startSEAnalysis();

            // 预取一句音频并返回解码后的 AudioBuffer
            const fetchSentence = async (sentence) => {
                const url = '/api/tts?voice=' + encodeURIComponent(voice)
                    + '&rate=' + encodeURIComponent(rate)
                    + '&pitch=' + encodeURIComponent(pitch)
                    + '&text=' + encodeURIComponent(sentence);
                const resp = await fetch(url);
                if (!resp.ok) throw new Error('Edge TTS ' + resp.status);
                const arrBuf = await resp.arrayBuffer();
                return await this.audioCtx.decodeAudioData(arrBuf);
            };

            // 播放一个 AudioBuffer，结束后 resolve
            const playBuffer = (buffer) => new Promise((resolve) => {
                const src = this.audioCtx.createBufferSource();
                src.buffer = buffer;
                src.connect(this.seAnalyser);
                src.onended = () => {
                    if (this.seSource === src) this.seSource = null;
                    resolve();
                };
                this.seSource = src;
                src.start();
            });

            // 顺序播放，同时预取下一句以减少句间停顿
            let nextPromise = fetchSentence(validSentences[0]);
            for (let i = 0; i < validSentences.length; i++) {
                // stopped 退出时：仅在被外部中断（cancelTTS）时不触发 onEnd
                // 避免中断后仍调用 finishSpeak → startAutoListen 自动开始倾听
                if (this.stopped) { this.stopSEAnalysis(); if (!this._interrupted) { onEnd && onEnd(); } return; }
                const buffer = await nextPromise;
                if (this.stopped) { this.stopSEAnalysis(); if (!this._interrupted) { onEnd && onEnd(); } return; }
                // 预取下一句（与当前播放并行）
                const prefetch = (i + 1 < validSentences.length)
                    ? fetchSentence(validSentences[i + 1]) : null;
                await playBuffer(buffer);
                nextPromise = prefetch;
            }
            this.stopSEAnalysis();
            if (!this._interrupted) {
                this._onEndCallback && this._onEndCallback();
            }
            this._onEndCallback = null;
        }

        /** 启动在线音频实时音量分析（驱动颗粒动画） */
        startSEAnalysis() {
            const tick = () => {
                if (!this.seAnalyser) return;
                this.seAnalyser.getByteFrequencyData(this.seData);
                let sum = 0;
                for (let i = 0; i < this.seData.length; i++) sum += this.seData[i];
                const avg = sum / this.seData.length / 255; // 归一化 0-1
                this.onLevel && this.onLevel(avg);
                this.seRafId = requestAnimationFrame(tick);
            };
            tick();
        }

        /** 停止在线音量分析 */
        stopSEAnalysis() {
            if (this.seRafId) {
                cancelAnimationFrame(this.seRafId);
                this.seRafId = null;
            }
            // 断开旧的 analyser 节点，避免音频图累积导致后续播放异常
            if (this.seAnalyser) {
                try { this.seAnalyser.disconnect(); } catch (e) {}
                this.seAnalyser = null;
            }
            this.onLevel && this.onLevel(0);
        }

        /** 浏览器本地 TTS（原有逻辑保留） */
        speakBrowser(text, onEnd) {
            if (!this.supported || !text) {
                onEnd && onEnd();
                return;
            }
            speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            if (this.voice) u.voice = this.voice;
            u.lang = 'zh-CN';
            u.rate = this.rate;
            u.pitch = this.pitch;
            u.onend = () => {
                if (!this._interrupted) {
                    this._onEndCallback && this._onEndCallback();
                }
                this._onEndCallback = null;
            };
            u.onerror = () => {
                if (!this._interrupted) {
                    this._onEndCallback && this._onEndCallback();
                }
                this._onEndCallback = null;
            };
            speechSynthesis.speak(u);
        }

        stop() {
            // 中断在线播放
            this.stopped = true;
            this.stopSEAnalysis();
            if (this.seSource) {
                try { this.seSource.stop(); } catch (e) {}
                this.seSource = null;
            }
            // 中断浏览器 TTS（仅在 browser 引擎时调用，避免 Chrome speechSynthesis
            // cancel 后卡住的已知 bug 影响 edge 引擎）
            if (this.supported && this.engine === 'browser') speechSynthesis.cancel();
        }

        /** 取消当前 TTS 播放（外部中断，如唤醒词打断），不触发 onEnd 回调 */
        cancelTTS() {
            this._interrupted = true;
            this._onEndCallback = null;
            this.stop();
        }
    }

    /* ============================================================
     * 7.5 系统指令管理模块（沙箱化执行 + 语音确认）
     * ============================================================ */
    /**
     * 系统指令管理器：负责解析 AI 回复中的系统指令、调用后端沙箱执行、
     * 在右下角面板显示指令、需要确认时弹出确认框并支持语音确认/取消。
     *
     * 指令格式：AI 回复中使用 <<SYS_CMD>>指令<<END_SYS_CMD>> 标记系统操作
     */
    class SystemCommandManager {
        constructor() {
            this.cmdList = $('#cmd-list');           // 指令列表容器
            this.modal = $('#cmd-confirm-modal');    // 确认弹窗
            this.confirmHint = $('#cmd-confirm-hint');
            this.confirmCommand = $('#cmd-confirm-command');
            this.voiceHint = $('#cmd-confirm-voice-hint');
            this.confirmBtn = $('#cmd-confirm-btn');
            this.cancelBtn = $('#cmd-cancel-btn');
            this.clearBtn = $('#cmd-clear-btn');

            this.pendingCommand = null;   // 待确认的指令
            this.confirmResolve = null;    // 确认 Promise 的 resolve
            this.voiceRecognizer = null;  // 语音确认识别器
            this.voiceTimeout = null;     // 语音确认超时定时器
            this.onCommandResult = null;  // 指令执行结果回调
            this.onClear = null;          // 清空列表时的回调（用于销毁图表等资源）

            this.bindUI();
        }

        /** 绑定 UI 事件 */
        bindUI() {
            // 确认按钮
            this.confirmBtn.addEventListener('click', () => this.resolveConfirm(true));
            // 取消按钮
            this.cancelBtn.addEventListener('click', () => this.resolveConfirm(false));
            // 清空指令列表
            this.clearBtn.addEventListener('click', () => this.clearList());
            // 点击遮罩取消
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.resolveConfirm(false);
            });
        }

        /**
         * 从 AI 回复文本中提取系统指令
         * 格式：<<SYS_CMD>>指令内容<<END_SYS_CMD>>
         * @returns {{cleanText: string, commands: string[]}}
         */
        parseCommands(aiText) {
            const commands = [];
            const pattern = /<<SYS_CMD>>([\s\S]*?)<<END_SYS_CMD>>/g;
            let match;
            let cleanText = aiText;

            while ((match = pattern.exec(aiText)) !== null) {
                const cmd = match[1].trim();
                if (cmd) commands.push(cmd);
            }
            // 移除指令标记，保留纯文本回复
            cleanText = aiText.replace(pattern, '').replace(/\n{3,}/g, '\n\n').trim();

            return { cleanText, commands };
        }

        /**
         * 执行指令：先发送到后端分类，安全指令直接执行，需确认指令弹窗
         * @param {string} command 指令字符串
         * @returns {Promise<object>} 执行结果
         */
        async executeCommand(command) {
            // 在面板中显示指令（待执行状态）
            const itemEl = this.appendCommand(command, 'pending');

            try {
                // 先发送到后端进行分类
                const resp = await fetch('/api/system-command', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command, confirmed: false })
                });
                const data = await resp.json();

                // 需要确认的指令
                if (data.needConfirm) {
                    this.updateCommand(itemEl, 'confirm', command, data.reason);
                    const confirmed = await this.showConfirm(command, data.reason);
                    if (!confirmed) {
                        this.updateCommand(itemEl, 'denied', command, '用户取消执行');
                        return { success: false, output: '', error: '用户取消执行', cancelled: true };
                    }
                    // 用户确认后重新请求执行
                    this.updateCommand(itemEl, 'executing', command, '执行中...');
                    const resp2 = await fetch('/api/system-command', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ command, confirmed: true })
                    });
                    const data2 = await resp2.json();
                    this.applyResult(itemEl, command, data2);
                    return data2;
                }

                // 被拒绝的指令
                if (data.level === 'denied') {
                    this.updateCommand(itemEl, 'denied', command, data.reason);
                    return data;
                }

                // 安全指令已执行完成
                this.applyResult(itemEl, command, data);
                return data;

            } catch (e) {
                this.updateCommand(itemEl, 'failed', command, '请求失败: ' + e.message);
                return { success: false, output: '', error: e.message };
            }
        }

        /** 应用执行结果到指令项 */
        applyResult(itemEl, command, data) {
            if (data.success) {
                const output = (data.output || '').trim();
                this.updateCommand(itemEl, 'success', command, output || '执行成功');
            } else {
                const errMsg = (data.error || '执行失败').trim();
                this.updateCommand(itemEl, 'failed', command, errMsg);
            }
        }

        /** 在面板中追加一条指令 */
        appendCommand(command, status) {
            const item = document.createElement('div');
            item.className = 'cmd-item ' + status;
            const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });

            item.innerHTML = `
                <div class="cmd-item-header">
                    <span class="cmd-item-status ${status}">${this.statusText(status)}</span>
                    <span class="cmd-item-time">${time}</span>
                </div>
                <div class="cmd-item-text">${this.escapeHtml(command)}</div>
            `;
            this.cmdList.appendChild(item);
            this.scrollList();
            return item;
        }

        /** 更新指令项状态和输出 */
        updateCommand(itemEl, status, command, output) {
            if (!itemEl) return;
            itemEl.className = 'cmd-item ' + status;
            const statusEl = itemEl.querySelector('.cmd-item-status');
            if (statusEl) {
                statusEl.className = 'cmd-item-status ' + status;
                statusEl.textContent = this.statusText(status);
            }
            // 更新或添加输出区域
            let outputEl = itemEl.querySelector('.cmd-item-output');
            if (!output) return;
            if (!outputEl) {
                outputEl = document.createElement('div');
                outputEl.className = 'cmd-item-output';
                itemEl.appendChild(outputEl);
            }
            outputEl.className = 'cmd-item-output' + (status === 'failed' || status === 'denied' ? ' error' : '');
            outputEl.textContent = output;
            this.scrollList();
        }

        /** 获取状态显示文本 */
        statusText(status) {
            const map = {
                pending: 'PENDING',
                safe: 'SAFE',
                confirm: 'CONFIRM',
                executing: 'RUNNING',
                success: 'SUCCESS',
                failed: 'FAILED',
                denied: 'DENIED'
            };
            return map[status] || status.toUpperCase();
        }

        /** 滚动到最新指令 */
        scrollList() {
            this.cmdList.scrollTop = this.cmdList.scrollHeight;
        }

        /** 清空指令列表 */
        clearList() {
            this.cmdList.innerHTML = '';
            // 触发清空回调（用于销毁图表实例等资源）
            if (typeof this.onClear === 'function') {
                this.onClear();
            }
        }

        /** HTML 转义 */
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        /* ---------- 确认弹窗 ---------- */

        /**
         * 显示确认弹窗，返回用户是否确认
         * @returns {Promise<boolean>}
         */
        showConfirm(command, reason) {
            return new Promise((resolve) => {
                this.pendingCommand = command;
                this.confirmResolve = resolve;
                this.confirmHint.textContent = reason || '此操作可能修改系统状态，请确认是否执行';
                this.confirmCommand.textContent = command;
                this.modal.classList.add('show');
                this.modal.setAttribute('aria-hidden', 'false');

                // 启动语音确认识别
                this.startVoiceConfirm();
            });
        }

        /** 处理确认/取消结果 */
        resolveConfirm(confirmed) {
            if (!this.confirmResolve) return;
            // 关闭弹窗
            this.modal.classList.remove('show');
            this.modal.setAttribute('aria-hidden', 'true');
            // 停止语音识别
            this.stopVoiceConfirm();
            // 解析 Promise
            const resolve = this.confirmResolve;
            this.confirmResolve = null;
            this.pendingCommand = null;
            resolve(confirmed);
        }

        /* ---------- 语音确认 ---------- */

        /** 启动语音识别，监听"确认"或"取消" */
        startVoiceConfirm() {
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SR) {
                this.voiceHint.textContent = '当前浏览器不支持语音确认，请点击按钮';
                return;
            }

            // 复用已有识别器或创建新的
            if (this.voiceRecognizer) {
                try { this.voiceRecognizer.stop(); } catch (e) {}
            }

            this.voiceRecognizer = new SR();
            // 使用中文识别器，确认词为中文
            this.voiceRecognizer.lang = 'zh-CN';
            this.voiceRecognizer.continuous = false;
            this.voiceRecognizer.interimResults = true;

            this.voiceRecognizer.onresult = (e) => {
                let text = '';
                for (let i = 0; i < e.results.length; i++) {
                    text += e.results[i][0].transcript;
                }
                text = text.toLowerCase().trim();
                console.log('[语音确认] 识别到:', text);

                // 匹配确认词
                if (/确认|确定|是|yes|ok|执行/.test(text)) {
                    this.resolveConfirm(true);
                    return;
                }
                // 匹配取消词
                if (/取消|否|不|no|停止|放弃/.test(text)) {
                    this.resolveConfirm(false);
                    return;
                }
            };

            this.voiceRecognizer.onerror = (e) => {
                console.warn('[语音确认] 错误:', e.error);
            };

            this.voiceRecognizer.onend = () => {
                // 若弹窗仍在显示且未解析，则重启识别继续等待
                if (this.confirmResolve && this.modal.classList.contains('show')) {
                    setTimeout(() => {
                        if (!this.confirmResolve) return;
                        try {
                            this.voiceRecognizer.start();
                        } catch (e) {
                            // 重启失败则忽略
                        }
                    }, 300);
                }
            };

            try {
                this.voiceRecognizer.start();
                this.voiceHint.textContent = '正在聆听...请说"确认"或"取消"';
                console.log('[语音确认] 已启动，等待语音输入');
            } catch (e) {
                console.warn('[语音确认] 启动失败:', e.message);
                this.voiceHint.textContent = '语音确认启动失败，请点击按钮';
            }

            // 设置15秒超时自动取消
            this.voiceTimeout = setTimeout(() => {
                if (this.confirmResolve) {
                    console.log('[语音确认] 超时自动取消');
                    this.resolveConfirm(false);
                }
            }, 15000);
        }

        /** 停止语音确认识别 */
        stopVoiceConfirm() {
            if (this.voiceTimeout) {
                clearTimeout(this.voiceTimeout);
                this.voiceTimeout = null;
            }
            if (this.voiceRecognizer) {
                try { this.voiceRecognizer.stop(); } catch (e) {}
                this.voiceRecognizer = null;
            }
        }
    }

    /* ============================================================
     * 7.6 文件内容查看器
     * ============================================================ */
    /**
     * 文件内容查看器：根据文件类型在右下角面板展示内容
     * 支持文本、图片、代码高亮、二进制文件提示
     */
    class ContentDisplayManager {
        constructor() {
            // 使用统一的 cmd-panel 作为内容展示容器
            this.listEl = $('#cmd-list');
            this.badgeEl = $('#cmd-agent-badge');
            this.charts = new Map();   // 图表实例缓存（key=canvas id）
            this.chartSeq = 0;
        }

        /** 设置 Agent 角色徽章 */
        setAgentBadge(agentType) {
            const meta = {
                basic: '基础问答',
                local: '本机操作',
                dev:   '专业开发',
                data:  '数据统计'
            };
            const name = meta[agentType] || '';
            if (name) {
                this.badgeEl.textContent = name;
                this.badgeEl.className = 'cmd-agent-badge ' + (agentType || 'basic');
            } else {
                this.badgeEl.textContent = '';
            }
        }

        /** 从指令中提取文件路径（cat/head/tail/open 等指令） */
        extractFilePath(command) {
            if (!command) return null;
            const trimmed = command.trim();

            // 匹配 cat/head/tail/less/more + 文件路径
            const catMatch = trimmed.match(/^(?:cat|head|tail|less|more)\s+(-[A-Za-z]+\s+)?(.+)$/);
            if (catMatch) {
                return this.cleanPath(catMatch[2]);
            }

            // 匹配 open -a "App" / open 文件
            const openMatch = trimmed.match(/^open\s+(?:-a\s+["'][^"']+["']\s+)?(.+)$/);
            if (openMatch) {
                return this.cleanPath(openMatch[1]);
            }

            return null;
        }

        /** 清理路径：去除引号、尾部参数、命令连接符 */
        cleanPath(raw) {
            let p = raw.trim();
            // 去除尾部管道、重定向、命令连接符（&& ; | >）
            p = p.split(/\s*(?:&&|[|>;])\s*/)[0].trim();
            // 去除引号
            if ((p.startsWith('"') && p.endsWith('"')) ||
                (p.startsWith("'") && p.endsWith("'"))) {
                p = p.slice(1, -1);
            }
            return p || null;
        }

        /**
         * 添加一个内容项到展示区
         * @param {Object} item { type, ... }
         */
        addItem(item) {
            const el = document.createElement('div');
            el.className = 'cmd-item';
            el.dataset.type = item.type;

            switch (item.type) {
                case 'code':
                    el.innerHTML = this.renderCode(item);
                    this.bindCopyBtn(el);
                    break;
                case 'image':
                    el.innerHTML = this.renderImage(item);
                    break;
                case 'chart':
                    el.innerHTML = this.renderChartShell(item);
                    // 异步渲染图表（DOM 已插入）
                    requestAnimationFrame(() => this.renderChart(item, el));
                    break;
                case 'file':
                    // 异步加载文件内容
                    el.innerHTML = `<div class="ct-file-meta">加载中：${this.escapeHtml(item.path)}</div>`;
                    this.loadFile(item.path, el);
                    break;
                case 'command':
                    el.innerHTML = this.renderCommand(item);
                    break;
                default:
                    el.innerHTML = `<div class="ct-file-text">${this.escapeHtml(item.content || '')}</div>`;
            }

            this.listEl.appendChild(el);
            // 自动滚动到底部
            this.listEl.scrollTop = this.listEl.scrollHeight;
        }

        /** 渲染代码块 */
        renderCode(item) {
            const lang = this.escapeHtml(item.lang || 'code');
            const code = this.escapeHtml(item.content || '');
            const highlighted = this.simpleHighlight(code);
            return `
                <div class="ct-code-block">
                    <div class="ct-code-head">
                        <span><span class="ct-type-tag code">CODE</span>${lang}</span>
                        <button class="ct-copy-btn">复制</button>
                    </div>
                    <pre class="ct-code"><code>${highlighted}</code></pre>
                </div>`;
        }

        /** 渲染图片 */
        renderImage(item) {
            // 优先使用 src；若 content 是 URL 则作为 src 使用；最后尝试 base64
            let src = item.src || '';
            if (!src && item.content && /^https?:\/\//i.test(item.content)) {
                src = item.content;
            }
            if (!src && item.mime && item.content) {
                src = `data:${item.mime};base64,${item.content}`;
            }
            if (!src) return '<div class="ct-file-text">[图片数据缺失]</div>';
            return `
                <div>
                    <div class="ct-file-meta"><span class="ct-type-tag image">IMAGE</span>${this.escapeHtml(item.name || '')}</div>
                    <div class="ct-image-wrap"><img class="ct-image" src="${src}" alt="${this.escapeHtml(item.name || '图片')}" onerror="this.parentElement.innerHTML='<div style=&quot;color:#ef4444;font-size:12px;&quot;>图片加载失败: ' + this.src</div>"></div>
                </div>`;
        }

        /** 渲染图表外壳（canvas 容器，稍后填充） */
        renderChartShell(item) {
            const title = this.escapeHtml(item.title || '');
            const chartType = this.escapeHtml(item.chartType || 'bar');
            return `
                <div class="ct-chart-wrap">
                    <div class="ct-chart-title"><span class="ct-type-tag chart">CHART</span>${title}</div>
                    <div class="ct-chart-canvas-wrap">
                        <canvas></canvas>
                    </div>
                    <div class="ct-file-meta" style="display:none;">类型：${chartType}</div>
                </div>`;
        }

        /** 实例化 Chart.js */
        renderChart(item, rootEl) {
            if (typeof Chart === 'undefined') {
                rootEl.querySelector('.ct-chart-canvas-wrap').innerHTML =
                    '<div style="color:#ef4444;font-size:12px;text-align:center;padding:20px;">Chart.js 未加载</div>';
                return;
            }
            const canvas = rootEl.querySelector('canvas');
            if (!canvas) return;

            const chartType = (item.chartType || 'bar').toLowerCase();
            const data = item.data || {};
            const labels = data.labels || [];
            const datasets = (data.datasets || []).map(ds => ({
                label: ds.label || '',
                data: ds.data || [],
                backgroundColor: this.pickColors(labels.length),
                borderColor: this.pickColors(labels.length, 0.9),
                borderWidth: 1
            }));

            const config = {
                type: chartType === 'doughnut' ? 'doughnut' : chartType,
                data: { labels, datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: datasets.length > 1, labels: { font: { size: 10 } } },
                        title: { display: false }
                    },
                    scales: (chartType === 'pie' || chartType === 'doughnut')
                        ? {}
                        : {
                            x: { ticks: { font: { size: 9 } } },
                            y: { ticks: { font: { size: 9 } } }
                        }
                }
            };

            const chart = new Chart(canvas, config);
            const id = 'chart_' + (++this.chartSeq);
            this.charts.set(id, chart);
            canvas.dataset.chartId = id;
        }

        /** 生成图表颜色（循环取色） */
        pickColors(n, alpha = 0.7) {
            const palette = [
                'rgba(96, 165, 250, ALPHA)',
                'rgba(168, 85, 247, ALPHA)',
                'rgba(34, 197, 94, ALPHA)',
                'rgba(251, 146, 60, ALPHA)',
                'rgba(236, 72, 153, ALPHA)',
                'rgba(20, 184, 166, ALPHA)',
                'rgba(245, 158, 11, ALPHA)',
                'rgba(99, 102, 241, ALPHA)'
            ];
            const out = [];
            for (let i = 0; i < n; i++) {
                out.push(palette[i % palette.length].replace('ALPHA', alpha));
            }
            return out;
        }

        /** 渲染指令项 */
        renderCommand(item) {
            const cmd = this.escapeHtml(item.command || '');
            const status = item.status || 'pending';
            const statusText = { pending: '待执行', auto: '自动执行', success: '成功', failed: '失败', cancelled: '已取消' }[status] || status;
            const output = item.output ? this.escapeHtml(item.output) : '';
            return `
                <div>
                    <div class="ct-file-meta"><span class="ct-type-tag command">CMD</span>${statusText}</div>
                    <pre class="ct-code"><code>${cmd}</code></pre>
                    ${output ? `<pre class="ct-file-text">${output}</pre>` : ''}
                </div>`;
        }

        /** 加载文件内容并渲染 */
        async loadFile(path, el) {
            try {
                const resp = await fetch('/api/file-content', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path })
                });
                const data = await resp.json();
                this.renderFileContent(path, data, el);
            } catch (e) {
                el.innerHTML = `<div class="ct-file-text" style="color:#ef4444;">加载失败: ${this.escapeHtml(e.message)}</div>`;
            }
        }

        /** 渲染文件内容到指定元素 */
        renderFileContent(path, data, el) {
            const name = path.split('/').pop() || path;
            const sizeStr = this.formatSize(data.size || 0);

            if (data.type === 'error' || data.error) {
                el.innerHTML = `<div class="ct-file-text" style="color:#ef4444;">${this.escapeHtml(data.error || '读取失败')}</div>`;
                return;
            }
            if (data.type === 'not_found') {
                el.innerHTML = `<div class="ct-file-text" style="color:#ef4444;">文件不存在: ${this.escapeHtml(path)}</div>`;
                return;
            }

            if (data.type === 'image') {
                el.innerHTML = this.renderImage({
                    name, mime: data.mimeType, content: data.content
                });
                return;
            }
            if (data.type === 'text') {
                const ext = (path.split('.').pop() || '').toLowerCase();
                const codeExts = ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'go',
                                  'rs', 'rb', 'php', 'sh', 'bash', 'css', 'scss', 'html', 'xml',
                                  'json', 'yml', 'yaml', 'toml', 'sql', 'vue', 'svelte'];
                const isCode = codeExts.includes(ext);
                const lang = isCode ? ext : 'text';
                el.innerHTML = `
                    <div class="ct-file-meta"><span class="ct-type-tag file">FILE</span>${this.escapeHtml(name)} | ${sizeStr}</div>
                    ${isCode
                        ? `<div class="ct-code-block"><div class="ct-code-head"><span>${lang}</span><button class="ct-copy-btn">复制</button></div><pre class="ct-code"><code>${this.simpleHighlight(this.escapeHtml(data.content || ''))}</code></pre></div>`
                        : `<pre class="ct-file-text">${this.escapeHtml(data.content || '')}</pre>`
                    }`;
                this.bindCopyBtn(el);
                return;
            }
            if (data.type === 'binary') {
                el.innerHTML = `<div class="ct-file-meta"><span class="ct-type-tag file">FILE</span>${this.escapeHtml(name)} | ${sizeStr}</div><div class="ct-file-text">[二进制文件，无法直接预览]</div>`;
                return;
            }
            el.innerHTML = `<div class="ct-file-text">不支持的类型: ${this.escapeHtml(data.type)}</div>`;
        }

        /** 绑定复制按钮 */
        bindCopyBtn(rootEl) {
            const btn = rootEl.querySelector('.ct-copy-btn');
            if (!btn) return;
            btn.addEventListener('click', () => {
                const codeEl = rootEl.querySelector('.ct-code code') || rootEl.querySelector('.ct-file-text');
                if (!codeEl) return;
                const text = codeEl.textContent || '';
                navigator.clipboard.writeText(text).then(() => {
                    const old = btn.textContent;
                    btn.textContent = '已复制';
                    setTimeout(() => { btn.textContent = old; }, 1200);
                }).catch(() => showToast('复制失败'));
            });
        }

        /** 简易语法高亮：关键词、字符串、注释、数字 */
        simpleHighlight(escapedHtml) {
            let html = escapedHtml;
            html = html.replace(/(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;|`[^`]*?`)/g,
                '<span style="color:#fbbf24;">$1</span>');
            html = html.replace(/(\/\/[^\n]*)/g, '<span style="color:#6b7280;">$1</span>');
            html = html.replace(/(#[^\n]*)/g, '<span style="color:#6b7280;">$1</span>');
            html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#6b7280;">$1</span>');
            html = html.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#fb923c;">$1</span>');
            const keywords = ['function', 'const', 'let', 'var', 'class', 'return', 'if',
                              'else', 'for', 'while', 'switch', 'case', 'break', 'continue',
                              'import', 'export', 'from', 'default', 'async', 'await',
                              'new', 'this', 'super', 'extends', 'try', 'catch', 'finally',
                              'throw', 'typeof', 'instanceof', 'in', 'of', 'void',
                              'def', 'elif', 'lambda', 'with', 'pass', 'yield', 'global',
                              'public', 'private', 'protected', 'static', 'final', 'abstract',
                              'int', 'string', 'bool', 'boolean', 'float', 'double',
                              'true', 'false', 'null', 'None', 'True', 'False', 'nil'];
            const kwPattern = new RegExp('\\b(' + keywords.join('|') + ')\\b', 'g');
            html = html.replace(kwPattern, '<span style="color:#60a5fa;">$1</span>');
            return html;
        }

        /** 清空所有内容 */
        clear() {
            // 销毁图表实例
            this.destroyCharts();
            this.listEl.innerHTML = '';
        }

        /** 仅销毁所有图表实例（不清空列表） */
        destroyCharts() {
            this.charts.forEach(c => { try { c.destroy(); } catch (e) {} });
            this.charts.clear();
        }

        /** 格式化文件大小 */
        formatSize(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / 1024 / 1024).toFixed(2) + ' MB';
        }

        /** HTML 转义 */
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        }
    }

    /* ============================================================
     * 7.5 智控设备管理模块
     * ============================================================ */
    /**
     * 智控设备管理器：负责设备扫描、展示、拖拽排序、控制指令执行、语音控制集成
     * 设备数据由后端 device_manager.py 持久化，前端通过 REST API 交互
     */
    class DeviceManager {
        constructor() {
            this.devices = [];            // 当前设备列表
            this.cloudDevices = [];       // 云平台同步的设备列表
            this.cloudPlatforms = [];     // 支持的云平台配置
            this.cloudAccounts = [];      // 已登录的云平台账号
            this.panel = $('#device-panel');
            this.listEl = $('#device-list');
            this.countEl = $('#device-panel-count');
            this.scanBtn = $('#device-scan-btn');
            this.toggleBtn = $('#device-toggle-btn');
            this.modal = $('#device-modal');
            this.modalClose = $('#device-modal-close');
            this.modalAddBtn = $('#dev-add-btn');
            this.modalScanBtn = $('#dev-scan-modal-btn');
            this.manageList = $('#device-manage-list');
            this.cloudPlatformSelect = $('#cloud-platform-select');
            this.cloudCredentialForm = $('#cloud-credential-form');
            this.cloudLoginBtn = $('#cloud-login-btn');
            this.cloudAccountList = $('#cloud-account-list');
            this.tabBtns = document.querySelectorAll('.device-tab-btn');
            this.tabContents = document.querySelectorAll('.device-tab-content');
            this.scanning = false;
            this.onControlResult = null;  // 设备控制结果回调（用于语音播报）
            this.dragSrcId = null;        // 拖拽源设备 ID
            this.lastDeviceId = null;     // 上次操作的设备 ID（用于代词指代）

            this.bindUI();
        }

        /** 绑定 UI 事件 */
        bindUI() {
            // 设备面板扫描按钮
            if (this.scanBtn) {
                const handleScan = (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.scan();
                };
                this.scanBtn.addEventListener('click', handleScan);
            }
            // 设备面板收起/展开
            this.toggleBtn.addEventListener('click', () => this.togglePanel());
            // 顶部设备管理按钮（打开弹窗）
            const devicesBtn = $('#devices-btn');
            if (devicesBtn) {
                devicesBtn.addEventListener('click', () => this.openModal());
            }
            // 弹窗关闭
            this.modalClose.addEventListener('click', () => this.closeModal());
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.closeModal();
            });
            // 弹窗内添加设备
            this.modalAddBtn.addEventListener('click', () => this.addFromForm());
            // 弹窗内重新扫描
            this.modalScanBtn.addEventListener('click', () => this.scan());
            // 设备类型切换时自动填充默认端口
            $('#dev-type').addEventListener('change', (e) => {
                const portMap = { light: 80, switch: 80, speaker: 80, tv: 8001, sensor: 80, generic: 80 };
                $('#dev-port').value = portMap[e.target.value] || 80;
            });
            // 协议切换时更新指令输入框提示文案
            $('#dev-protocol').addEventListener('change', (e) => {
                const isHttp = e.target.value === 'http';
                const hint = isHttp ? '指令内容（如：/on 路径）' : '指令内容（如：OPEN_CMD 数据）';
                document.querySelectorAll('.cmd-payload').forEach(inp => {
                    inp.placeholder = hint;
                });
            });
            // 自定义按钮：添加新行
            $('#dev-add-cmd-btn').addEventListener('click', () => this.addCmdRow());
            // 自定义按钮：删除行（事件委托）
            $('#device-cmd-editor').addEventListener('click', (e) => {
                if (e.target.classList.contains('cmd-remove-btn')) {
                    const row = e.target.closest('.device-cmd-row');
                    // 至少保留一行
                    const rows = $('#device-cmd-editor').querySelectorAll('.device-cmd-row');
                    if (rows.length > 1) {
                        row.remove();
                    } else {
                        // 清空最后一行内容
                        row.querySelectorAll('input').forEach(inp => inp.value = '');
                    }
                }
            });
            // Tab 切换：本地设备 / 云平台
            this.tabBtns.forEach(btn => {
                btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
            });
            // 云平台选择：动态渲染凭证表单，扫码平台自动触发登录
            this.cloudPlatformSelect.addEventListener('change', (e) => {
                const pid = e.target.value;
                this.renderCredentialForm(pid);
                // 扫码登录平台选中后自动弹出二维码
                const plat = this.cloudPlatforms.find(p => p.id === pid);
                if (plat && plat.auth_type === 'qr') {
                    this.mijiaQrLogin();
                }
            });
            // 云平台登录按钮
            this.cloudLoginBtn.addEventListener('click', () => this.loginCloud());
        }

        /** 切换 Tab（local / cloud） */
        switchTab(tab) {
            this.tabBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === tab);
            });
            this.tabContents.forEach(c => {
                c.classList.toggle('active', c.id === `device-tab-${tab}`);
            });
            // 切换到云平台 Tab 时加载平台列表与账号
            if (tab === 'cloud') {
                this.loadCloudPlatforms();
                this.loadCloudAccounts();
            }
        }

        /** 加载支持的云平台列表 */
        async loadCloudPlatforms() {
            try {
                const resp = await fetch('/api/cloud/platforms');
                const data = await resp.json();
                if (data.success) {
                    this.cloudPlatforms = data.platforms || [];
                    // 仅在首次加载时填充下拉
                    if (this.cloudPlatformSelect.options.length <= 1) {
                        this.cloudPlatforms.forEach(p => {
                            const opt = document.createElement('option');
                            opt.value = p.id;
                            opt.textContent = `${p.name} - ${p.description || ''}`;
                            this.cloudPlatformSelect.appendChild(opt);
                        });
                    }
                    // 若下拉已有选中值，刷新凭证表单以匹配最新平台配置
                    if (this.cloudPlatformSelect.value) {
                        this.renderCredentialForm(this.cloudPlatformSelect.value);
                    }
                }
            } catch (e) {
                console.warn('[云平台] 加载平台列表失败:', e.message);
            }
        }

        /** 根据平台 ID 动态渲染凭证输入表单 */
        renderCredentialForm(platformId) {
            const platform = this.cloudPlatforms.find(p => p.id === platformId);
            if (!platform) {
                this.cloudCredentialForm.innerHTML = '';
                this.cloudLoginBtn.style.display = '';
                this.cloudLoginBtn.textContent = '登录并保存';
                return;
            }
            // 扫码登录平台（如米家）：不显示凭证表单和登录按钮，选中即自动弹二维码
            if (platform.auth_type === 'qr') {
                this.cloudCredentialForm.innerHTML = `
                    <div class="cloud-qr-hint">使用米家APP扫描二维码完成登录，选中即自动弹出二维码</div>
                `;
                // 隐藏登录按钮，扫码由选择平台时自动触发
                this.cloudLoginBtn.style.display = 'none';
                return;
            }
            const fields = platform.auth_fields.map(f => `
                <div class="device-form-group cloud-credential-field">
                    <label>${this.escapeHtml(f.label)}</label>
                    <input type="text" data-key="${f.key}" placeholder="${this.escapeHtml(f.placeholder || '')}">
                </div>
            `).join('');
            this.cloudCredentialForm.innerHTML = `<div class="device-form-row">${fields}</div>`;
            this.cloudLoginBtn.textContent = '登录并保存';
            this.cloudLoginBtn.style.display = '';
        }

        /** 登录云平台（保存凭证） */
        async loginCloud() {
            const platformId = this.cloudPlatformSelect.value;
            if (!platformId) {
                showToast('请先选择平台');
                return;
            }
            const platform = this.cloudPlatforms.find(p => p.id === platformId);
            // 扫码登录平台走专属流程
            if (platform && platform.auth_type === 'qr') {
                this.mijiaQrLogin();
                return;
            }
            // 非 qr 平台需要凭证字段，若平台未加载提示重新选择
            if (!platform || !platform.auth_fields || platform.auth_fields.length === 0) {
                showToast('平台信息未加载，请重新选择平台');
                return;
            }
            const inputs = this.cloudCredentialForm.querySelectorAll('input[data-key]');
            const credentials = {};
            let missing = false;
            inputs.forEach(inp => {
                const key = inp.dataset.key;
                const val = inp.value.trim();
                if (!val) missing = true;
                credentials[key] = val;
            });
            if (missing) {
                showToast('请填写所有凭证字段');
                return;
            }
            this.cloudLoginBtn.disabled = true;
            this.cloudLoginBtn.textContent = '登录中...';
            try {
                const resp = await fetch('/api/cloud/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ platform: platformId, credentials })
                });
                const data = await resp.json();
                if (data.success) {
                    showToast(`已登录: ${data.account.platform_name}`);
                    this.loadCloudAccounts();
                    // 清空凭证输入
                    inputs.forEach(inp => inp.value = '');
                } else {
                    showToast('登录失败: ' + (data.error || '未知错误'));
                }
            } catch (e) {
                showToast('登录请求失败: ' + e.message);
            } finally {
                this.cloudLoginBtn.disabled = false;
                // 根据平台类型恢复按钮文字
                this.cloudLoginBtn.textContent =
                    (platform && platform.auth_type === 'qr') ? '扫码登录' : '登录并保存';
            }
        }

        /** 米家扫码登录 */
        async mijiaQrLogin() {
            this.cloudLoginBtn.disabled = true;
            this.cloudLoginBtn.textContent = '获取二维码...';
            try {
                // 获取二维码
                const startResp = await fetch('/api/cloud/mijia/qr/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const startData = await startResp.json();
                if (!startData.success) {
                    showToast('获取二维码失败: ' + (startData.error || '未知错误'));
                    return;
                }
                // 已有有效 Token，直接登录成功
                if (startData.status === 'logged_in') {
                    showToast('米家账号已登录');
                    this.loadCloudAccounts();
                    this.loadCloudDevices();
                    return;
                }
                // 弹出二维码弹窗
                this.showQrModal(startData.qr_url, startData.session_id);
            } catch (e) {
                showToast('扫码登录请求失败: ' + e.message);
            } finally {
                this.cloudLoginBtn.disabled = false;
                this.cloudLoginBtn.textContent = '扫码登录';
            }
        }

        /** 显示二维码弹窗并开始轮询 */
        showQrModal(qrUrl, sessionId) {
            // 创建弹窗
            const overlay = document.createElement('div');
            overlay.className = 'qr-modal-overlay';
            overlay.innerHTML = `
                <div class="qr-modal">
                    <div class="qr-modal-title">米家扫码登录</div>
                    <div class="qr-modal-hint">请使用米家APP扫描下方二维码</div>
                    <div class="qr-modal-img-wrap">
                        <img src="${this.escapeHtml(qrUrl)}" alt="登录二维码" class="qr-modal-img">
                    </div>
                    <div class="qr-modal-status">等待扫码...</div>
                    <div class="qr-modal-actions">
                        <button class="qr-modal-cancel">取消</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            const statusEl = overlay.querySelector('.qr-modal-status');
            const cancelBtn = overlay.querySelector('.qr-modal-cancel');
            let cancelled = false;
            let pollTimer = null;

            const closeModal = () => {
                cancelled = true;
                if (pollTimer) clearTimeout(pollTimer);
                overlay.remove();
            };

            cancelBtn.addEventListener('click', () => {
                closeModal();
                // 通知后端取消
                fetch('/api/cloud/mijia/qr/cancel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: sessionId })
                }).catch(() => {});
            });

            // 轮询登录状态
            const poll = async () => {
                if (cancelled) return;
                try {
                    const resp = await fetch('/api/cloud/mijia/qr/poll', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ session_id: sessionId })
                    });
                    const data = await resp.json();
                    if (cancelled) return;
                    if (data.status === 'success') {
                        statusEl.textContent = '登录成功';
                        statusEl.classList.add('qr-status-success');
                        showToast('米家扫码登录成功');
                        setTimeout(() => {
                            closeModal();
                            this.loadCloudAccounts();
                            this.loadCloudDevices();
                        }, 800);
                    } else if (data.status === 'pending') {
                        statusEl.textContent = '等待扫码...';
                        pollTimer = setTimeout(poll, 3000);
                    } else {
                        // error
                        statusEl.textContent = '登录失败: ' + (data.error || '未知错误');
                        statusEl.classList.add('qr-status-error');
                        setTimeout(() => closeModal(), 2000);
                    }
                } catch (e) {
                    if (cancelled) return;
                    statusEl.textContent = '网络错误，重试中...';
                    pollTimer = setTimeout(poll, 5000);
                }
            };
            // 延迟 1 秒后开始轮询
            pollTimer = setTimeout(poll, 1000);
        }

        /** 加载已登录的云平台账号列表 */
        async loadCloudAccounts() {
            try {
                const resp = await fetch('/api/cloud/accounts');
                const data = await resp.json();
                if (data.success) {
                    this.cloudAccounts = data.accounts || [];
                    this.renderCloudAccounts();
                }
            } catch (e) {
                console.warn('[云平台] 加载账号列表失败:', e.message);
            }
        }

        /** 渲染已登录账号列表 */
        renderCloudAccounts() {
            if (!this.cloudAccountList) return;
            if (this.cloudAccounts.length === 0) {
                this.cloudAccountList.innerHTML = '<div class="device-list-empty">暂未登录任何云平台账号</div>';
                return;
            }
            this.cloudAccountList.innerHTML = this.cloudAccounts.map(acc => {
                const creds = Object.entries(acc.credentials || {})
                    .map(([k, v]) => `<span class="cloud-cred-item">${this.escapeHtml(k)}: ${this.escapeHtml(v)}</span>`)
                    .join('');
                return `
                    <div class="cloud-account-item" data-id="${acc.id}">
                        <div class="cloud-account-info">
                            <div class="cloud-account-name">
                                <span class="cloud-platform-tag">${this.escapeHtml(acc.platform_name)}</span>
                                <span class="cloud-account-meta">${acc.device_count || 0} 设备 · ${acc.last_sync || '未同步'}</span>
                            </div>
                            <div class="cloud-account-creds">${creds}</div>
                        </div>
                        <div class="cloud-account-actions">
                            <button class="cloud-sync-btn" data-id="${acc.id}" data-action="sync">同步设备</button>
                            <button class="cloud-logout-btn" data-id="${acc.id}" data-action="logout">退出</button>
                        </div>
                    </div>
                `;
            }).join('');
            // 绑定同步/退出按钮
            this.cloudAccountList.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = btn.dataset.id;
                    const action = btn.dataset.action;
                    if (action === 'sync') this.syncCloud(id, btn);
                    else if (action === 'logout') this.logoutCloud(id);
                });
            });
        }

        /** 同步云平台设备 */
        async syncCloud(accountId, btnEl) {
            if (btnEl) {
                btnEl.disabled = true;
                btnEl.textContent = '同步中...';
            }
            try {
                const resp = await fetch('/api/cloud/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ account_id: accountId })
                });
                const data = await resp.json();
                if (data.success) {
                    const count = (data.devices || []).length;
                    showToast(`同步完成，共 ${count} 个设备`);
                    this.loadCloudAccounts();
                    this.loadCloudDevices();
                } else {
                    showToast('同步失败: ' + (data.error || '未知错误'));
                }
            } catch (e) {
                showToast('同步请求失败: ' + e.message);
            } finally {
                if (btnEl) {
                    btnEl.disabled = false;
                    btnEl.textContent = '同步设备';
                }
            }
        }

        /** 退出云平台登录 */
        async logoutCloud(accountId) {
            try {
                const resp = await fetch('/api/cloud/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ account_id: accountId })
                });
                const data = await resp.json();
                if (data.success) {
                    showToast('已退出登录');
                    this.loadCloudAccounts();
                    this.loadCloudDevices();
                } else {
                    showToast('退出失败: ' + (data.error || '未知错误'));
                }
            } catch (e) {
                showToast('退出请求失败: ' + e.message);
            }
        }

        /** 加载云平台同步的设备 */
        async loadCloudDevices() {
            try {
                const resp = await fetch('/api/cloud/devices');
                const data = await resp.json();
                if (data.success) {
                    this.cloudDevices = data.devices || [];
                    this.render();
                }
            } catch (e) {
                console.warn('[云平台] 加载云设备失败:', e.message);
            }
        }

        /** 添加一行自定义命令编辑器 */
        addCmdRow() {
            const editor = $('#device-cmd-editor');
            const row = document.createElement('div');
            row.className = 'device-cmd-row';
            row.innerHTML = `
                <input type="text" class="cmd-name" placeholder="按钮名称（如：开灯）" maxlength="20">
                <input type="number" class="cmd-port" placeholder="端口（空=默认）" min="1" max="65535">
                <input type="text" class="cmd-payload" placeholder="指令内容（如：/on 或 OPEN_CMD）" maxlength="200">
                <button type="button" class="cmd-remove-btn" title="删除此行">&times;</button>
            `;
            editor.appendChild(row);
        }

        /** 收集自定义命令编辑器中的命令列表 */
        collectCustomCommands() {
            const rows = $('#device-cmd-editor').querySelectorAll('.device-cmd-row');
            const commands = [];
            rows.forEach((row, idx) => {
                const name = row.querySelector('.cmd-name').value.trim();
                const portStr = row.querySelector('.cmd-port').value.trim();
                const payload = row.querySelector('.cmd-payload').value.trim();
                // 仅当按钮名称或指令内容有值时才收集
                if (!name && !payload) return;
                commands.push({
                    name: name || `按钮${idx + 1}`,
                    action: `cmd_${idx}`,
                    endpoint: payload,
                    method: 'GET',
                    port: portStr ? parseInt(portStr) : null,
                    payload: payload
                });
            });
            return commands;
        }

        /** 清空自定义命令编辑器（保留一个空行） */
        clearCmdEditor() {
            const editor = $('#device-cmd-editor');
            editor.innerHTML = `
                <div class="device-cmd-row">
                    <input type="text" class="cmd-name" placeholder="按钮名称（如：开灯）" maxlength="20">
                    <input type="number" class="cmd-port" placeholder="端口（空=默认）" min="1" max="65535">
                    <input type="text" class="cmd-payload" placeholder="指令内容（如：/on 或 OPEN_CMD）" maxlength="200">
                    <button type="button" class="cmd-remove-btn" title="删除此行">&times;</button>
                </div>
            `;
        }

        /** 加载设备列表（同时加载云设备） */
        async load() {
            try {
                const resp = await fetch('/api/devices');
                const data = await resp.json();
                if (data.success) {
                    this.devices = data.devices || [];
                }
                // 等待云设备加载完成后再渲染，确保云设备按钮可见
                await this.loadCloudDevices();
                this.render();
            } catch (e) {
                console.warn('[设备] 加载失败:', e.message);
            }
        }

        /** 扫描局域网设备 */
        async scan() {
            if (this.scanning) return;
            if (!this.scanBtn) return;
            this.scanning = true;
            this.scanBtn.classList.add('scanning');
            this._setScanBtnText('扫描中');
            try {
                const resp = await fetch('/api/devices/scan', { method: 'POST' });
                const data = await resp.json();
                if (data.success) {
                    this.devices = data.devices || [];
                    this.render();
                    this.renderManageList();
                    showToast(`扫描完成，发现 ${data.scannedCount} 个在线设备`);
                } else {
                    showToast('扫描失败: ' + (data.error || '未知错误'));
                }
            } catch (e) {
                showToast('扫描请求失败: ' + e.message);
            } finally {
                this.scanning = false;
                this.scanBtn.classList.remove('scanning');
                this._setScanBtnText('扫描');
            }
        }

        /** 安全设置扫描按钮文字（兼容 SVG + 文本节点结构） */
        _setScanBtnText(text) {
            if (!this.scanBtn) return;
            // 查找并更新最后一个文本节点（保留 SVG，不操作 innerHTML）
            const nodes = this.scanBtn.childNodes;
            for (let i = nodes.length - 1; i >= 0; i--) {
                if (nodes[i].nodeType === Node.TEXT_NODE) {
                    nodes[i].textContent = ' ' + text;
                    return;
                }
            }
            // 如果没有文本节点，创建一个
            this.scanBtn.appendChild(document.createTextNode(' ' + text));
        }

        /** 收起/展开设备面板 */
        togglePanel() {
            this.panel.classList.toggle('collapsed');
        }

        /** 渲染右上角设备面板（合并本地设备与云设备） */
        render() {
            // 本地可见设备
            const localVisible = this.devices.filter(d => d.visible !== false);
            // 云设备默认全部可见（无 visible 字段控制）
            const cloudVisible = this.cloudDevices || [];
            // 合并：本地设备在前，云设备在后
            const all = [
                ...[...localVisible].sort((a, b) => (a.order || 0) - (b.order || 0)),
                ...cloudVisible
            ];
            this.countEl.textContent = all.length;

            if (all.length === 0) {
                this.listEl.innerHTML = '<div class="device-list-empty">暂无设备，点击扫描或添加</div>';
                return;
            }

            this.listEl.innerHTML = all.map(d => this.renderCard(d)).join('');

            // 绑定控制按钮事件
            this.listEl.querySelectorAll('.device-cmd-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    const action = btn.dataset.action;
                    this.control(id, action, btn);
                });
            });

            // 绑定拖拽事件（仅本地设备支持拖拽排序）
            this.bindDragAndDrop();
        }

        /** 渲染单个设备卡片 */
        renderCard(d) {
            const statusClass = d.status === 'online' ? 'online' : 'offline';
            const statusText = d.status === 'online' ? '在线' : '离线';
            const icon = this.getDeviceIcon(d.type);
            const brandTag = d.brand ? `<span class="device-card-brand">${this.escapeHtml(d.brand)}</span>` : '';
            // 云设备显示平台标识，本地设备显示 ip:port
            const isCloud = !!d.platform;
            const metaText = isCloud
                ? `云·${this.escapeHtml(d.brand || d.platform || '')} · ${statusText}`
                : `${d.ip}:${d.port} · ${d.protocol} · ${statusText}`;
            const cloudBadge = isCloud ? '<span class="device-card-cloud">云</span>' : '';
            const commands = (d.commands || []).map(c =>
                `<button class="device-cmd-btn" data-id="${d.id}" data-action="${c.action}" ${d.status !== 'online' ? 'disabled' : ''}>${this.escapeHtml(c.name)}</button>`
            ).join('');
            return `
                <div class="device-card" draggable="true" data-id="${d.id}">
                    <div class="device-card-head">
                        <span class="device-card-icon">${icon}</span>
                        <span class="device-card-name" title="${this.escapeHtml(d.name)}">${this.escapeHtml(d.name)}</span>
                        ${brandTag}
                        ${cloudBadge}
                        <span class="device-card-status ${statusClass}" title="${statusText}"></span>
                    </div>
                    <div class="device-card-meta">${metaText}</div>
                    <div class="device-card-commands">${commands || '<span style="font-size:10px;color:var(--text-dim)">无控制命令</span>'}</div>
                </div>
            `;
        }

        /** 获取设备类型图标（SVG） */
        getDeviceIcon(type) {
            const icons = {
                light: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2a7 7 0 0 0-4 12.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26A7 7 0 0 0 12 2zm-2 18a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1h-4v1z"/></svg>',
                switch: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3H7zm5 5a2 2 0 0 1 2 2v6a2 2 0 1 1-4 0V9a2 2 0 0 1 2-2z"/></svg>',
                speaker: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 3a3 3 0 0 0-3 3v12a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zm0 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/></svg>',
                tv: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H3zm5 16h8v2H8v-2z"/></svg>',
                sensor: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2a10 10 0 0 0-10 10 10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm0 4a6 6 0 0 1 6 6h-2a4 4 0 0 0-4-4V6z"/></svg>',
                generic: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>'
            };
            return icons[type] || icons.generic;
        }

        /** 绑定拖拽排序事件 */
        bindDragAndDrop() {
            const cards = this.listEl.querySelectorAll('.device-card');
            cards.forEach(card => {
                card.addEventListener('dragstart', (e) => {
                    this.dragSrcId = card.dataset.id;
                    card.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                });
                card.addEventListener('dragend', () => {
                    card.classList.remove('dragging');
                    this.listEl.querySelectorAll('.device-card').forEach(c => c.classList.remove('drag-over'));
                });
                card.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (card.dataset.id !== this.dragSrcId) {
                        card.classList.add('drag-over');
                    }
                });
                card.addEventListener('dragleave', () => {
                    card.classList.remove('drag-over');
                });
                card.addEventListener('drop', (e) => {
                    e.preventDefault();
                    card.classList.remove('drag-over');
                    const targetId = card.dataset.id;
                    if (!this.dragSrcId || targetId === this.dragSrcId) return;
                    this.reorder(this.dragSrcId, targetId);
                });
            });
        }

        /** 重新排序：将 srcId 移动到 targetId 位置之前 */
        async reorder(srcId, targetId) {
            // 仅对可见设备重排
            const visible = this.devices.filter(d => d.visible !== false)
                .sort((a, b) => (a.order || 0) - (b.order || 0));
            const ids = visible.map(d => d.id);
            const srcIdx = ids.indexOf(srcId);
            const targetIdx = ids.indexOf(targetId);
            if (srcIdx < 0 || targetIdx < 0) return;
            ids.splice(srcIdx, 1);
            ids.splice(targetIdx, 0, srcId);
            // 同步本地顺序
            ids.forEach((id, idx) => {
                const dev = this.devices.find(d => d.id === id);
                if (dev) dev.order = idx;
            });
            this.render();
            // 持久化到后端
            try {
                await fetch('/api/devices/reorder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids })
                });
            } catch (e) {
                console.warn('[设备] 排序保存失败:', e.message);
            }
        }

        /** 控制设备（自动识别本地设备或云设备并路由到对应接口） */
        async control(deviceId, action, btnEl) {
            // 本地设备与云设备合并查找
            const device = this.devices.find(d => d.id === deviceId)
                || (this.cloudDevices || []).find(d => d.id === deviceId);
            if (!device) return;
            // 检查是否为数值类属性（需要用户输入具体值）
            const cmd = (device.commands || []).find(c => c.action === action);
            if (cmd && cmd.value === 'custom') {
                const range = cmd.range || [];
                const rangeHint = range.length >= 2
                    ? `（范围 ${range[0]}~${range[1]}${range.length >= 3 && range[2] !== 1 ? ' 步长 ' + range[2] : ''}）`
                    : '';
                const input = prompt(`请输入${cmd.name}${rangeHint}`, range[0] !== undefined ? String(range[0]) : '');
                if (input === null) return;  // 用户取消
                const numVal = Number(input);
                if (isNaN(numVal)) {
                    showToast('请输入有效数值');
                    return;
                }
                if (range.length >= 2 && (numVal < range[0] || numVal > range[1])) {
                    showToast(`数值超出范围 ${range[0]}~${range[1]}`);
                    return;
                }
                return this.executeControl(deviceId, action, btnEl, { custom_value: numVal });
            }
            return this.executeControl(deviceId, action, btnEl, {});
        }

        /** 实际执行控制请求 */
        async executeControl(deviceId, action, btnEl, extra) {
            const device = this.devices.find(d => d.id === deviceId)
                || (this.cloudDevices || []).find(d => d.id === deviceId);
            if (!device) return;
            // 设备已识别即绑定当前设备，确保后续指令可沿用此设备（即使控制失败也保留绑定）
            this.lastDeviceId = deviceId;
            const isCloud = !!device.platform;
            if (btnEl) {
                btnEl.classList.add('executing');
                btnEl.disabled = true;
            }
            try {
                // 根据设备来源选择控制接口
                const url = isCloud ? '/api/cloud/control' : '/api/devices/control';
                const body = isCloud
                    ? Object.assign({ device_id: deviceId, action }, extra)
                    : Object.assign({ id: deviceId, action }, extra);
                const resp = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const data = await resp.json();
                const success = data.success;
                if (btnEl) {
                    btnEl.classList.remove('executing');
                    btnEl.classList.add(success ? 'success' : 'failed');
                    setTimeout(() => {
                        btnEl.classList.remove('success', 'failed');
                        btnEl.disabled = false;
                    }, 1500);
                }
                if (success) {
                    this.lastDeviceId = deviceId;
                }
                // 触发控制结果回调（用于语音播报）
                if (this.onControlResult) {
                    this.onControlResult({
                        device: device.name,
                        action: this.getActionName(device, action),
                        success,
                        error: data.error || '',
                        output: data.output || ''
                    });
                }
                return data;
            } catch (e) {
                if (btnEl) {
                    btnEl.classList.remove('executing');
                    btnEl.classList.add('failed');
                    setTimeout(() => {
                        btnEl.classList.remove('failed');
                        btnEl.disabled = false;
                    }, 1500);
                }
                if (this.onControlResult) {
                    this.onControlResult({
                        device: device.name,
                        action: this.getActionName(device, action),
                        success: false,
                        error: e.message,
                        output: ''
                    });
                }
                return { success: false, error: e.message };
            }
        }

        /** 获取命令的显示名称 */
        getActionName(device, action) {
            const cmd = (device.commands || []).find(c => c.action === action);
            return cmd ? cmd.name : action;
        }

        /** 执行 AI 返回的设备控制指令（支持统一数据结构） */
        async executeDeviceControl(block) {
            const deviceName = block.device || '';
            const actionName = block.action || '';
            const content = block.content || '';

            // 尝试解析 content 中的 JSON（统一数据结构）
            let unifiedResult = null;
            if (content) {
                try {
                    const parsed = JSON.parse(content);
                    if (parsed.action_type) {
                        unifiedResult = parsed;
                    }
                } catch (e) {
                    // 非 JSON 格式，继续走原有流程
                }
            }

            // 如果拿到了统一数据结构，直接处理
            if (unifiedResult) {
                return this._handleUnifiedResult(unifiedResult);
            }

            if (!deviceName && !content) {
                showToast('无效的设备控制指令');
                return;
            }

            let device = null;
            let action = actionName || '';

            if (content && !action) {
                // 尝试从 content 中提取动作
                try {
                    const parsed = JSON.parse(content);
                    if (parsed.device) deviceName = parsed.device;
                    if (parsed.action) action = parsed.action;
                } catch (e) {
                    // content 可能是纯文本动作名
                    action = content.trim();
                }
            }

            if (!action) {
                showToast('未指定要执行的动作');
                return;
            }

            const allDevices = [...this.devices, ...(this.cloudDevices || [])];

            if (deviceName) {
                device = allDevices.find(d =>
                    d.name && d.name.includes(deviceName)
                );

                if (!device) {
                    if (this.lastDeviceId) {
                        const lastDevice = allDevices.find(d => d.id === this.lastDeviceId);
                        if (lastDevice) {
                            showToast(`未找到设备 "${deviceName}"，使用上次操作的设备: ${lastDevice.name}`);
                            device = lastDevice;
                        } else {
                            showToast(`未找到设备: ${deviceName}`);
                            return;
                        }
                    } else {
                        showToast(`未找到设备: ${deviceName}`);
                        return;
                    }
                }
            } else {
                if (this.lastDeviceId) {
                    device = allDevices.find(d => d.id === this.lastDeviceId);
                    if (device) {
                        showToast(`未指定设备，使用上次操作的设备: ${device.name}`);
                    } else {
                        showToast('未指定设备，请先选择要控制的设备');
                        return;
                    }
                } else {
                    showToast('未指定设备，请先选择要控制的设备');
                    return;
                }
            }

            const cmd = (device.commands || []).find(c =>
                c.action === action || c.name === action || c.name.includes(action)
            );

            if (!cmd) {
                const cmdNames = (device.commands || []).map(c => c.name).join('、');
                showToast(`设备 ${device.name} 不支持动作: ${action}。可用指令: ${cmdNames || '无'}`);
                return;
            }

            const result = await this.executeControl(device.id, cmd.action, null, {});

            if (result && result.success) {
                this.lastDeviceId = device.id;
            }

            return result;
        }

        /** 处理统一数据结构的结果 */
        async _handleUnifiedResult(result) {
            const actionType = result.action_type || '';

            // 如果消息中检测到设备名，更新当前设备
            if (result.matched_device_id) {
                this.lastDeviceId = result.matched_device_id;
            }

            switch (actionType) {
                case 'device_control': {
                    // 成功匹配，执行控制
                    const device = result.device;
                    const command = result.command;
                    if (!device || !command) {
                        showToast('无效的设备控制数据');
                        return { success: false, message: '无效的设备控制数据' };
                    }

                    const allDevices = [...this.devices, ...(this.cloudDevices || [])];
                    const matchedDevice = allDevices.find(d => d.id === device.id);
                    if (!matchedDevice) {
                        showToast(`设备 ${device.name} 不存在或已离线`);
                        return { success: false, message: `设备 ${device.name} 不存在或已离线` };
                    }

                    // 如果后端已执行控制（control_result 存在），直接使用后端结果
                    if (result.control_result) {
                        if (result.control_result.success) {
                            this.lastDeviceId = matchedDevice.id;
                        }
                        return {
                            success: result.control_result.success,
                            message: result.message || '正在执行',
                            error: result.control_result.error || ''
                        };
                    }

                    // 后端未执行（如 LLM 流程解析），前端执行控制
                    const result2 = await this.executeControl(
                        matchedDevice.id, command.action, null, {}
                    );

                    if (result2 && result2.success) {
                        this.lastDeviceId = matchedDevice.id;
                    }
                    return result2;
                }

                case 'device_query': {
                    // 设备查询结果，直接显示
                    showToast(result.message || '查询完成');
                    return { success: true, message: result.message };
                }

                case 'no_device': {
                    // 未找到设备
                    showToast(result.message || '未找到匹配的设备');
                    if (result.available_devices && result.available_devices.length > 0) {
                        console.log('[设备] 可用设备列表:', result.available_devices.map(d => d.name));
                    }
                    return { success: false, message: result.message };
                }

                case 'no_command': {
                    // 设备存在但不支持该指令，更新当前设备
                    if (result.device && result.device.id) {
                        this.lastDeviceId = result.device.id;
                    }
                    showToast(result.message || '设备不支持此操作');
                    if (result.available_commands && result.available_commands.length > 0) {
                        const cmdNames = result.available_commands.map(c => c.name).join('、');
                        console.log('[设备] 可用指令:', cmdNames);
                    }
                    return { success: false, message: result.message };
                }

                case 'clarify': {
                    // 需要用户澄清，显示可用设备提示
                    if (result.device && result.device.id) {
                        this.lastDeviceId = result.device.id;
                    }
                    showToast(result.message || '请说明具体的操作指令');
                    if (result.available_devices && result.available_devices.length > 0) {
                        const names = result.available_devices.map(d => d.name).join('、');
                        console.log('[设备] 未指定设备，可用设备:', names);
                    }
                    return { success: false, message: result.message };
                }

                default: {
                    showToast(result.message || '处理失败');
                    return { success: false, message: result.message };
                }
            }
        }

        /* ---------- 设备管理弹窗 ---------- */

        /** 打开设备管理弹窗 */
        openModal() {
            this.modal.classList.add('show');
            this.modal.setAttribute('aria-hidden', "false");
            this.renderManageList();
            // 打开弹窗时加载云平台数据（平台列表 + 账号 + 云设备）
            this.loadCloudPlatforms();
            this.loadCloudAccounts();
        }

        /** 关闭设备管理弹窗 */
        closeModal() {
            this.modal.classList.remove('show');
            this.modal.setAttribute('aria-hidden', 'true');
        }

        /** 从表单添加设备 */
        async addFromForm() {
            const name = $('#dev-name').value.trim();
            const brand = $('#dev-brand').value.trim();
            const type = $('#dev-type').value;
            const ip = $('#dev-ip').value.trim();
            const port = parseInt($('#dev-port').value) || 80;
            const protocol = $('#dev-protocol').value;
            if (!name || !ip) {
                showToast('请填写设备名称和 IP 地址');
                return;
            }
            // 收集自定义控制按钮（名称/端口/指令）
            const commands = this.collectCustomCommands();
            try {
                const resp = await fetch('/api/devices/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, brand, type, ip, port, protocol, commands })
                });
                const data = await resp.json();
                if (data.success) {
                    this.devices.push(data.device);
                    this.render();
                    this.renderManageList();
                    showToast(`已添加设备: ${name}`);
                    // 清空表单
                    $('#dev-name').value = '';
                    $('#dev-brand').value = '';
                    $('#dev-ip').value = '';
                    this.clearCmdEditor();
                } else {
                    showToast('添加失败: ' + (data.error || '未知错误'));
                }
            } catch (e) {
                showToast('添加请求失败: ' + e.message);
            }
        }

        /** 渲染设备管理列表 */
        renderManageList() {
            if (!this.manageList) return;
            if (this.devices.length === 0) {
                this.manageList.innerHTML = '<div class="device-list-empty">暂无设备，点击扫描或上方添加</div>';
                return;
            }
            const sorted = [...this.devices].sort((a, b) => (a.order || 0) - (b.order || 0));
            this.manageList.innerHTML = sorted.map(d => {
                const statusText = d.status === 'online' ? '在线' : '离线';
                const customTag = d.custom ? '<span class="custom-tag">自定义</span>' : '';
                const brandTag = d.brand ? `<span class="custom-tag brand-tag">${this.escapeHtml(d.brand)}</span>` : '';
                return `
                    <div class="device-manage-item" data-id="${d.id}">
                        <div class="device-manage-info">
                            <div class="device-manage-name">${this.escapeHtml(d.name)} ${brandTag} ${customTag}</div>
                            <div class="device-manage-meta">${d.ip}:${d.port} · ${d.protocol} · ${statusText} · ${(d.commands || []).length} 个命令</div>
                        </div>
                        <div class="device-manage-actions">
                            <button class="device-manage-toggle ${d.visible === false ? 'hidden-state' : ''}" data-id="${d.id}" data-action="toggle">${d.visible === false ? '显示' : '隐藏'}</button>
                            <button class="device-manage-delete" data-id="${d.id}" data-action="delete">删除</button>
                        </div>
                    </div>
                `;
            }).join('');

            // 绑定操作按钮
            this.manageList.querySelectorAll('.device-manage-toggle').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.toggleVisibility(btn.dataset.id);
                });
            });
            this.manageList.querySelectorAll('.device-manage-delete').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.deleteDevice(btn.dataset.id);
                });
            });
        }

        /** 切换设备可见性 */
        async toggleVisibility(deviceId) {
            const device = this.devices.find(d => d.id === deviceId);
            if (!device) return;
            const newVisible = device.visible === false ? true : false;
            try {
                const resp = await fetch('/api/devices/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: deviceId, updates: { visible: newVisible } })
                });
                const data = await resp.json();
                if (data.success) {
                    device.visible = newVisible;
                    this.render();
                    this.renderManageList();
                    showToast(`${device.name} 已${newVisible ? '显示' : '隐藏'}`);
                }
            } catch (e) {
                showToast('操作失败: ' + e.message);
            }
        }

        /** 删除设备 */
        async deleteDevice(deviceId) {
            const device = this.devices.find(d => d.id === deviceId);
            if (!device) return;
            if (!confirm(`确定删除设备「${device.name}」?`)) return;
            try {
                const resp = await fetch('/api/devices/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: deviceId })
                });
                const data = await resp.json();
                if (data.success) {
                    this.devices = this.devices.filter(d => d.id !== deviceId);
                    this.render();
                    this.renderManageList();
                    showToast(`已删除设备: ${device.name}`);
                }
            } catch (e) {
                showToast('删除失败: ' + e.message);
            }
        }

        /* ---------- 语音控制集成 ---------- */

        /**
         * 智能匹配语音指令（智控 Agent 核心）
         * 支持模糊匹配、代词指代、多设备候选澄清
         * @returns {object} {type, device?, cmd?, customValue?, candidates?, deviceNames?}
         *   type: 'execute' | 'clarify_device' | 'clarify_command' | 'not_found'
         */
        smartMatchCommand(text) {
            if (!text) return { type: 'not_found' };
            const allDevices = (this.devices || []).concat(this.cloudDevices || []);
            if (!allDevices.length) return { type: 'not_found' };
            const lower = text.toLowerCase().trim();

            // 提取数值（如"调到50"）
            const numMatch = text.match(/(\d+(?:\.\d+)?)/);
            const customValue = numMatch ? Number(numMatch[1]) : null;

            // 代词/继续词指代：它/这个/那个/再/换/也 → 使用上次操作的设备
            const pronouns = ['它', '这个', '那个', '这台', '这部', '再', '换', '也', '还是'];
            const hasPronoun = pronouns.some(p => text.includes(p));
            let contextDevice = null;
            if (hasPronoun && this.lastDeviceId) {
                contextDevice = allDevices.find(d => d.id === this.lastDeviceId && d.status !== 'offline');
            }

            // 步骤1：模糊匹配设备，收集候选列表
            const devCandidates = [];
            for (const device of allDevices) {
                if (device.status && device.status !== 'online') continue;
                const score = this._matchDeviceScore(device, lower, text, hasPronoun, contextDevice);
                if (score > 0) {
                    devCandidates.push({ device, score });
                }
            }
            // 按匹配分数降序
            devCandidates.sort((a, b) => b.score - a.score);

            // 步骤2：匹配命令动作
            const actionKeywords = this._extractAction(text, lower);

            // 无设备候选但有动作意图且有上次设备 → 默认操作上次设备
            if (devCandidates.length === 0 && actionKeywords.sem && this.lastDeviceId) {
                const lastDev = allDevices.find(d => d.id === this.lastDeviceId && d.status !== 'offline');
                if (lastDev) {
                    const cmd = this._matchCommandForDevice(lastDev, text, lower, actionKeywords, customValue);
                    if (cmd) {
                        return {
                            type: 'execute',
                            device: lastDev,
                            cmd: cmd,
                            customValue: customValue
                        };
                    }
                }
            }

            // 无设备候选
            if (devCandidates.length === 0) {
                return { type: 'not_found' };
            }

            // 步骤3：对每个设备候选尝试匹配命令
            const matched = [];
            for (const cand of devCandidates) {
                const cmd = this._matchCommandForDevice(cand.device, text, lower, actionKeywords, customValue);
                if (cmd) {
                    matched.push({ device: cand.device, cmd, score: cand.score });
                }
            }

            if (matched.length === 0) {
                // 设备匹配到但无命令匹配 → 询问用户要执行什么操作
                const topDev = devCandidates[0].device;
                return {
                    type: 'clarify_command',
                    device: topDev,
                    deviceNames: devCandidates.slice(0, 3).map(c => c.device.name)
                };
            }

            // 唯一匹配 → 直接执行
            if (matched.length === 1) {
                return {
                    type: 'execute',
                    device: matched[0].device,
                    cmd: matched[0].cmd,
                    customValue: customValue
                };
            }

            // 多个设备都能匹配 → 取分数最高的，若分数相同则需澄清
            const topScore = matched[0].score;
            const topMatches = matched.filter(m => m.score === topScore);
            if (topMatches.length === 1) {
                return {
                    type: 'execute',
                    device: topMatches[0].device,
                    cmd: topMatches[0].cmd,
                    customValue: customValue
                };
            }

            // 多设备候选 → 澄清
            return {
                type: 'clarify_device',
                candidates: topMatches.slice(0, 4).map(m => ({
                    device: m.device,
                    cmd: m.cmd
                })),
                customValue: customValue
            };
        }

        /**
         * 计算设备匹配分数（模糊匹配核心）
         * 分数越高匹配度越好
         */
        _matchDeviceScore(device, lower, text, hasPronoun, contextDevice) {
            let score = 0;
            const devName = (device.name || '').toLowerCase();
            const nameRaw = device.name || '';

            // 代词指代上次设备
            if (hasPronoun && contextDevice && contextDevice.id === device.id) {
                score += 100;
            }

            // 精确名称包含
            if (devName && lower.includes(devName)) {
                score += 50;
            }

            // 名称分词模糊匹配：设备名"客厅吊灯"，用户说"客厅的灯"
            if (devName) {
                const nameChars = nameRaw.split('');
                let hitCount = 0;
                for (const ch of nameChars) {
                    if (text.includes(ch)) hitCount++;
                }
                // 命中率超过 50% 给分
                const hitRatio = hitCount / nameChars.length;
                if (hitRatio >= 0.5) {
                    score += Math.round(hitRatio * 30);
                }
            }

            // 类型别名匹配
            const typeAliases = this.getTypeAliases(device.type);
            for (const alias of typeAliases) {
                if (text.includes(alias)) {
                    score += 20;
                    break;
                }
            }

            // 品牌匹配（云设备）
            if (device.brand && text.includes(device.brand)) {
                score += 10;
            }

            return score;
        }

        /**
         * 从语音文本中提取动作意图
         * 返回 { sem: 语义类别, matched: 匹配到的关键词 }
         */
        _extractAction(text, lower) {
            // 遍历所有语义类别，找到命中的
            const semMap = {
                on: ['打开', '开启', '开', '启动', '点亮', '通电', '开一下', '开开'],
                off: ['关闭', '关', '关掉', '停止', '熄灭', '断电', '关上', '关了'],
                toggle: ['切换', '反转', '切换状态'],
                vol_up: ['音量加', '音量大', '大声点', '调大音量', '音量调大', '大一点'],
                vol_down: ['音量减', '音量小', '小声点', '调小音量', '音量调小', '小一点'],
                mute: ['静音', '消音'],
                unmute: ['取消静音', '恢复声音'],
                read: ['读取', '读数', '查询数值', '查看数值'],
                status: ['状态', '查询状态', '查看状态', '当前状态'],
                brightness: ['亮度', '调亮', '调暗', '调到'],
                color: ['颜色', '变色', '红色', '绿色', '蓝色', '暖色', '冷色'],
                temperature: ['温度', '调温', '加热', '降温'],
                mode: ['模式', '自动模式', '手动模式', '睡眠模式'],
                speed: ['风速', '风速大', '风速小', '风速中'],
                start: ['开始', '启动', '运行', '干活'],
                pause: ['暂停'],
                resume: ['继续', '恢复'],
                stop: ['停止', '中止'],
                play: ['播放', '继续播放'],
                next: ['下一首', '下一个', '切歌'],
                prev: ['上一首', '上一个', '回退'],
                // 方向/导航指令（电视/投影仪等设备）
                up: ['向上', '上滑', '向上滑动', '上面'],
                down: ['向下', '下滑', '向下滑动', '下面'],
                left: ['向左', '左滑', '向左滑动'],
                right: ['向右', '右滑', '向右滑动'],
                ok: ['确认', '确定', '选中', '按下确定'],
                back: ['返回', '返回键', '上一页', '后退', '退出'],
                home: ['主页', '回到主页', '首页', '主页面', '回到首页', '回到桌面', '桌面'],
                menu: ['菜单', '调出菜单', '功能菜单', '快捷菜单'],
                settings: ['系统设置', '启动系统设置', '打开设置', '启动设置'],
                focus: ['对焦', '自动对焦'],
                power: ['关机选项', '按下电源'],
                fengmi: ['峰米菜单', '快捷面板']
            };
            for (const [sem, words] of Object.entries(semMap)) {
                for (const w of words) {
                    if (text.includes(w)) {
                        return { sem, matched: w };
                    }
                }
            }
            return { sem: '', matched: '' };
        }

        /**
         * 为指定设备匹配命令
         * 支持精确包含、反向包含、字符模糊、语义类别匹配
         * @returns {object|null} 命令对象
         */
        _matchCommandForDevice(device, text, lower, actionInfo, customValue) {
            for (const cmd of (device.commands || [])) {
                const cmdName = cmd.name || '';
                // 1. 命令名直接匹配（文本包含命令名）
                if (cmdName && text.includes(cmdName)) {
                    return cmd;
                }
                // 2. 命令名小写匹配
                if (cmdName && lower.includes(cmdName.toLowerCase())) {
                    return cmd;
                }
                // 3. 反向包含：命令名包含文本中的关键词（如命令"开机"，用户说"开"）
                if (cmdName && cmdName.length >= 2) {
                    // 提取命令名的核心词（去掉"命令/操作"等后缀）
                    const core = cmdName.replace(/(命令|操作|功能|设置|调节)$/, '');
                    if (core.length >= 1 && text.includes(core)) {
                        return cmd;
                    }
                }
            }
            // 4. 语义类别匹配（放在最后，作为兜底）
            for (const cmd of (device.commands || [])) {
                const cmdSem = this._actionSemantics(cmd.action);
                if (actionInfo.sem && cmdSem === actionInfo.sem) {
                    // 数值类命令需要数值
                    if (cmd.value === 'custom' && customValue === null) {
                        continue;
                    }
                    return cmd;
                }
            }
            return null;
        }

        /**
         * 中文数字转阿拉伯数字
         * 支持"一/二/三/第一/第二个/第3个/执行第一个"等
         * @returns {number|null}
         */
        chineseToNumber(text) {
            if (!text) return null;
            // 先尝试阿拉伯数字
            const numMatch = text.match(/(\d+)/);
            if (numMatch) return parseInt(numMatch[1]);

            // 中文数字映射
            const cnMap = {
                '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5,
                '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
                '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
                '6': 6, '7': 7, '8': 8, '9': 9, '0': 0
            };
            // 匹配"第X个"模式
            const ordMatch = text.match(/第\s*([一二两三四五六七八九十\d]+)\s*[个条]/);
            if (ordMatch) {
                const ch = ordMatch[1];
                if (cnMap[ch] !== undefined) return cnMap[ch];
                // 十以上的组合
                if (ch.includes('十')) {
                    const parts = ch.split('十');
                    const tens = parts[0] ? (cnMap[parts[0]] || 1) : 1;
                    const ones = parts[1] ? (cnMap[parts[1]] || 0) : 0;
                    return tens * 10 + ones;
                }
            }
            // 直接匹配单个中文数字
            for (const [ch, num] of Object.entries(cnMap)) {
                if (text.includes(ch)) return num;
            }
            return null;
        }

        /**
         * 匹配语音文本是否对应某设备控制指令
         * 动态根据当前设备名称与命令名称生成匹配规则
         * @returns {object|null} {deviceId, action, deviceName, actionName} 或 null
         */
        matchVoiceCommand(text) {
            if (!text) return null;
            // 合并本地设备与云设备进行匹配
            const allDevices = (this.devices || []).concat(this.cloudDevices || []);
            if (!allDevices.length) return null;
            const lower = text.toLowerCase().trim();

            // 尝试提取数值（如"把灯调到50"中的 50）
            const numMatch = text.match(/(\d+(?:\.\d+)?)/);
            const customValue = numMatch ? Number(numMatch[1]) : null;

            // 动态生成语音指令关键词表：设备名 + 命令名
            for (const device of allDevices) {
                if (device.status && device.status !== 'online') continue;
                // 设备名称匹配（支持包含）
                const devName = (device.name || '').toLowerCase();
                const nameMatched = devName && lower.includes(devName);
                // 设备类型别名匹配
                const typeAliases = this.getTypeAliases(device.type);
                const typeMatched = typeAliases.some(a => lower.includes(a));

                if (!nameMatched && !typeMatched) continue;

                // 匹配命令
                for (const cmd of (device.commands || [])) {
                    const cmdName = cmd.name || '';
                    // 命令名直接匹配
                    if (cmdName && text.includes(cmdName)) {
                        return this._buildVoiceMatch(device, cmd, cmdName, customValue);
                    }
                    // 命令名小写匹配
                    if (cmdName && lower.includes(cmdName.toLowerCase())) {
                        return this._buildVoiceMatch(device, cmd, cmdName, customValue);
                    }
                    // 动作别名匹配（开/关/打开/关闭等，兼容 on/off 与 turn_on/turn_off）
                    const aliases = this.getActionAliases(cmd.action);
                    if (aliases.some(a => lower.includes(a))) {
                        // 数值类命令需要用户提供了数值
                        if (cmd.value === 'custom' && customValue === null) {
                            continue;
                        }
                        return this._buildVoiceMatch(device, cmd, cmdName, customValue);
                    }
                }
            }
            return null;
        }

        /** 构建语音匹配结果 */
        _buildVoiceMatch(device, cmd, cmdName, customValue) {
            const result = {
                deviceId: device.id,
                action: cmd.action,
                deviceName: device.name,
                actionName: cmdName || cmd.action
            };
            // 数值类命令附带用户输入的数值
            if (cmd.value === 'custom' && customValue !== null) {
                result.customValue = customValue;
            }
            return result;
        }

        /** 获取设备类型的中文别名（用于语音匹配） */
        getTypeAliases(type) {
            const map = {
                light: ['灯', '灯具', '台灯', '吊灯', '射灯', '落地灯'],
                switch: ['开关', '插座', '排插'],
                speaker: ['音箱', '音响', '喇叭'],
                tv: ['电视', '电视机'],
                sensor: ['传感器', '感应器'],
                airconditioner: ['空调', '冷气'],
                fan: ['风扇', '电风扇'],
                curtain: ['窗帘'],
                humidifier: ['加湿器'],
                purifier: ['净化器', '空气净化器'],
                kettle: ['水壶', '电水壶'],
                cooker: ['电饭煲', '电饭锅', '锅'],
                vacuum: ['扫地机', '扫地机器人', '机器人'],
                generic: []
            };
            return map[type] || [];
        }

        /** 获取动作的中文别名（用于语音匹配，兼容本地 on/off 与米家 turn_on/turn_off） */
        getActionAliases(action) {
            if (!action) return [];
            // 统一映射：将各种 action 归一化到语义类别
            const sem = this._actionSemantics(action);
            const map = {
                on: ['打开', '开启', '开', '启动', '点亮', '通电'],
                off: ['关闭', '关', '关掉', '停止', '熄灭', '断电'],
                toggle: ['切换', '反转', '切换状态'],
                vol_up: ['音量加', '音量大', '大声点', '调大音量', '音量调大'],
                vol_down: ['音量减', '音量小', '小声点', '调小音量', '音量调小'],
                mute: ['静音', '消音'],
                unmute: ['取消静音', '恢复声音'],
                read: ['读取', '读数', '查询数值', '查看数值'],
                status: ['状态', '查询状态', '查看状态', '当前状态'],
                brightness: ['亮度', '调亮', '调暗', '调到'],
                color: ['颜色', '变色', '红色', '绿色', '蓝色', '暖色', '冷色'],
                temperature: ['温度', '调温', '加热', '降温'],
                mode: ['模式', '自动模式', '手动模式', '睡眠模式'],
                speed: ['风速', '风速大', '风速小', '风速中'],
                start: ['开始', '启动', '运行'],
                pause: ['暂停'],
                resume: ['继续', '恢复'],
                stop: ['停止', '中止'],
                play: ['播放', '继续播放'],
                next: ['下一首', '下一个', '切歌'],
                prev: ['上一首', '上一个', '回退']
            };
            return map[sem] || [];
        }

        /** 将 action 名归一化到语义类别（兼容本地 on/off 与米家 turn_on/turn_off/set_xxx） */
        _actionSemantics(action) {
            const a = String(action).toLowerCase();
            // 开关类
            if (a === 'on' || a === 'turn_on' || a === 'power_on' || a === 'open') return 'on';
            if (a === 'off' || a === 'turn_off' || a === 'power_off' || a === 'close') return 'off';
            if (a === 'toggle' || a === 'switch') return 'toggle';
            // 音量类
            if (a === 'vol_up' || a === 'volume_up' || a === 'volume_plus') return 'vol_up';
            if (a === 'vol_down' || a === 'volume_down' || a === 'volume_minus') return 'vol_down';
            if (a === 'mute' || a === 'set_mute') return 'mute';
            if (a === 'unmute') return 'unmute';
            // 状态查询类
            if (a === 'read' || a === 'get_prop') return 'read';
            if (a === 'status' || a === 'get_status') return 'status';
            // 数值属性类（米家 set_brightness / set_temperature 等）
            if (a.includes('brightness')) return 'brightness';
            if (a.includes('color') || a.includes('colour')) return 'color';
            if (a.includes('temperature') || a.includes('temp')) return 'temperature';
            if (a.includes('mode')) return 'mode';
            if (a.includes('speed') || a.includes('fan_level')) return 'speed';
            // 播放控制类
            if (a === 'start' || a === 'start_sweep' || a === 'start_play') return 'start';
            if (a === 'pause' || a === 'pause_play') return 'pause';
            if (a === 'resume') return 'resume';
            if (a === 'stop' || a === 'stop_play') return 'stop';
            if (a === 'play') return 'play';
            if (a === 'next' || a === 'next_track') return 'next';
            if (a === 'prev' || a === 'prev_track' || a === 'previous') return 'prev';
            // 方向/导航类（电视/投影仪 press-* / action_press-* 命令）
            // 统一将 - 替换为 _ 后匹配，覆盖 press-up / press_up / action_press-down / action_press_down 等变体
            const nav = a.replace(/-/g, '_');
            if (nav === 'up' || nav === 'press_up' || nav === 'action_press_up') return 'up';
            if (nav === 'down' || nav === 'press_down' || nav === 'action_press_down') return 'down';
            if (nav === 'left' || nav === 'press_left' || nav === 'action_press_left') return 'left';
            if (nav === 'right' || nav === 'press_right' || nav === 'action_press_right') return 'right';
            if (nav === 'ok' || nav === 'press_ok' || nav === 'action_press_ok') return 'ok';
            if (nav === 'back' || nav === 'press_back' || nav === 'action_press_back') return 'back';
            if (nav === 'home' || nav === 'press_home' || nav === 'action_press_home') return 'home';
            if (nav === 'menu' || nav === 'press_menu' || nav === 'action_press_menu') return 'menu';
            if (nav === 'settings' || nav === 'press_settings' || nav === 'action_press_settings') return 'settings';
            if (nav === 'focus' || nav === 'press_focus' || nav === 'action_press_focus') return 'focus';
            if (nav === 'power' || nav === 'press_power' || nav === 'action_press_power') return 'power';
            if (nav === 'fengmi' || nav === 'press_fengmi' || nav === 'action_press_fengmi') return 'fengmi';
            return '';
        }

        /** HTML 转义 */
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        }
    }

    /* ============================================================
     * 8. 应用主控
     * ============================================================ */
    class App {
        constructor() {
            ConfigManager.load();
            this.config = ConfigManager.data;
            this.apiClient = new ApiClient(this.config);
            this.synth = new SpeechSynth();
            this.synth.config = this.config;
            this.applyVoiceConfig();
            // 在线 TTS 播放时实时音量驱动颗粒动画
            this.synth.onLevel = (v) => {
                this.particles && this.particles.setVolume(v);
                this.updateVuMeter(v);
            };
            this.analyser = new VolumeAnalyser();
            this.recognizer = new SpeechRecognizer(
                (text) => this.onRecognizeInterim(text),
                (text) => this.onRecognizeEnd(text),
                (err) => this.onRecognizeError(err)
            );
            // 应用语音识别语言配置
            this.recognizer.setMode(this.config.sttLang || 'mixed');
            this.particles = new ParticleSystem($('#particle-canvas'));
            this.stars = new StarField($('#stars-canvas'));
            this.sysMonitor = new SystemMonitor();
            this.sysMonitor.onUpdate = (snap) => this.renderSystemStats(snap);
            // 系统指令管理器：沙箱化执行 + 语音确认
            this.cmdManager = new SystemCommandManager();
            // Agent 路由器：问题分类 + 联网搜索
            this.agentRouter = new AgentRouter();
            // 统一内容展示管理器：渲染代码/图片/图表/文件/指令等多种内容
            this.contentDisplay = new ContentDisplayManager();
            // 清空指令面板时同步销毁图表实例
            this.cmdManager.onClear = () => this.contentDisplay.destroyCharts();
            // 智控设备管理器：设备扫描、拖拽排序、控制、语音控制集成
            this.deviceManager = new DeviceManager();
            // 设备控制结果回调：语音播报控制结果
            this.deviceManager.onControlResult = (result) => this.onDeviceControlResult(result);
            // 启动时加载设备列表
            this.deviceManager.load();
            this.history = []; // 对话历史
            this.busy = false;
            this.autoListening = false; // 是否处于自动连续听取模式
            this.listenTimeout = null;  // 15秒无语音自动关闭定时器
            this.listenTimeoutMs = 15000; // 超时时间（毫秒）
            this.emptyRestartCount = 0;  // 空重启计数（防止无限重启循环）
            this.pendingClarify = null;  // 待澄清的智控上下文（多设备候选/命令不明确时）
            this.listenStarting = false; // 是否正在启动监听（标记异步过渡态，期间禁止重复点击启动/停止）

            // 唤醒词检测器：检测到 "Hi Seven" 或 "你好小七" 后自动开始对话
            this.wakeDetector = new WakeWordDetector(() => this.onWakeWord());
            // 实时显示识别内容到状态栏，便于用户验证唤醒词是否工作
            this.wakeDetector.onDebug = (text) => {
                if (this.wakeDetector && this.wakeDetector.running) {
                    $('#status-text').textContent = '听到：' + text;
                }
            };
            // 唤醒词检测需要用户手势激活（Chrome 要求），初始化时显示提示
            this.wakeActivated = false;  // 是否已通过用户手势激活唤醒功能
            this.bindWakeActivation();

            this.bindUI();
            this.syncConfigForm();
            this.applySystemStatsVisibility();
            this.analyser.onLevel = (v) => {
                this.particles.setVolume(v);
                this.updateVuMeter(v);
            };
        }

        /** 将当前配置中的语音参数应用到合成器 */
        applyVoiceConfig() {
            if (!this.synth) return;
            this.synth.config = this.config;
            this.synth.setEngine(this.config.ttsEngine);
            this.synth.setGender(this.config.voiceGender);
            this.synth.setProsody(this.config.voiceRate, this.config.voicePitch);
        }

        /** 根据配置切换系统状态框的显示与监控启停 */
        applySystemStatsVisibility() {
            const box = $('#sys-monitor');
            if (this.config.showSystemStats) {
                box.hidden = false;
                this.sysMonitor.start();
            } else {
                box.hidden = true;
                this.sysMonitor.stop();
            }
        }

        /** 渲染一次系统状态快照到 UI */
        renderSystemStats(snap) {
            // CPU
            $('#sys-cpu-val').textContent = snap.cpu.percent.toFixed(0) + '%';
            $('#sys-cpu-bar').style.width = snap.cpu.percent + '%';
            const cpuSub = snap.cpu.freqMHz > 0
                ? `${snap.cpu.cores || '--'} cores @ ${snap.cpu.freqMHz}MHz`
                : `${snap.cpu.cores || '--'} cores`;
            $('#sys-cpu-sub').textContent = cpuSub;
            this.applyBarLevel($('#sys-cpu-bar'), snap.cpu.percent);

            // 内存
            $('#sys-mem-val').textContent = snap.mem.percent.toFixed(0) + '%';
            $('#sys-mem-bar').style.width = snap.mem.percent + '%';
            $('#sys-mem-sub').textContent = snap.mem.total > 0
                ? `${snap.mem.used.toFixed(2)} / ${snap.mem.total.toFixed(2)} GB`
                : '-- / -- GB';
            this.applyBarLevel($('#sys-mem-bar'), snap.mem.percent);

            // 存储
            $('#sys-disk-val').textContent = snap.disk.percent.toFixed(0) + '%';
            $('#sys-disk-bar').style.width = snap.disk.percent + '%';
            $('#sys-disk-sub').textContent = snap.disk.total > 0
                ? `${snap.disk.used.toFixed(1)} / ${snap.disk.total.toFixed(1)} GB`
                : '-- / -- GB';
            this.applyBarLevel($('#sys-disk-bar'), snap.disk.percent);
        }

        /** 按占用率为进度条添加告警样式 */
        applyBarLevel(barEl, percent) {
            barEl.classList.remove('warn', 'danger');
            if (percent >= 85) barEl.classList.add('danger');
            else if (percent >= 65) barEl.classList.add('warn');
        }

        /* ---------- UI 绑定 ---------- */
        bindUI() {
            // 麦克风按钮
            $('#mic-btn').addEventListener('click', () => this.toggleListen());

            // 清空对话记录
            $('#chat-clear-btn').addEventListener('click', () => this.clearChat());

            // 手动输入对话：回车发送，Shift+Enter 换行
            const chatInput = $('#chat-input');
            const chatSendBtn = $('#chat-send-btn');
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this._sendManualMessage();
                }
            });
            chatSendBtn.addEventListener('click', () => this._sendManualMessage());

            // 设置面板
            $('#settings-btn').addEventListener('click', () => this.openPanel());
            $('#close-panel').addEventListener('click', () => this.closePanel());
            $('#mask').addEventListener('click', () => this.closePanel());

            // 服务商切换
            $('#provider-select').addEventListener('change', (e) => {
                ConfigManager.applyPreset(e.target.value);
                this.config = ConfigManager.data;
                this.syncConfigForm();
            });

            // 保存配置
            $('#save-config').addEventListener('click', () => this.saveConfig());
            $('#reset-config').addEventListener('click', () => this.resetConfig());

            // 语音性别切换（即时预览 + 更新在线音色列表）
            document.querySelectorAll('input[name="voice-gender"]').forEach(radio => {
                radio.addEventListener('change', (e) => {
                    this.config.voiceGender = e.target.value;
                    this.synth.setGender(e.target.value);
                    this.synth.setProsody(this.config.voiceRate, this.config.voicePitch);
                    this.populateVoices(e.target.value);
                    // 试听一句话
                    this.synth.speak(
                        e.target.value === 'male' ? '已切换为男声，沉稳拟人。' : '已切换为女声，生动拟人。',
                        null
                    );
                });
            });

            // 语音引擎切换
            $('#tts-engine').addEventListener('change', (e) => {
                this.config.ttsEngine = e.target.value;
                this.synth.setEngine(e.target.value);
                this.updateVoiceSettingsVisibility();
                // 引擎切换后重新填充对应音色列表
                const gender = this.config.voiceGender === 'male' ? 'male' : 'female';
                this.populateVoices(gender);
            });

            // Edge TTS 音色选择（保存到对应配置项）
            $('#se-voice-select').addEventListener('change', (e) => {
                if (this.config.voiceGender === 'male') {
                    this.config.edgeVoiceMale = e.target.value;
                } else {
                    this.config.edgeVoiceFemale = e.target.value;
                }
            });

            // 语速/音调滑块实时显示数值
            const rateInput = $('#voice-rate');
            const pitchInput = $('#voice-pitch');
            rateInput.addEventListener('input', (e) => {
                $('#voice-rate-val').textContent = Number(e.target.value).toFixed(2);
            });
            pitchInput.addEventListener('input', (e) => {
                $('#voice-pitch-val').textContent = Number(e.target.value).toFixed(2);
            });

            // 电脑运行状态开关（实时切换显示）
            $('#sys-stats-toggle').addEventListener('change', (e) => {
                this.config.showSystemStats = e.target.checked;
                this.applySystemStatsVisibility();
            });

            // 唤醒词开关（实时切换检测）
            $('#wake-word-toggle').addEventListener('change', (e) => {
                this.config.wakeWord = e.target.checked;
                if (e.target.checked) {
                    this.startWakeWord();
                } else {
                    this.stopWakeWord();
                }
            });

            // 全屏
            $('#fullscreen-btn').addEventListener('click', () => this.toggleFullscreen());

            // 键盘快捷键
            document.addEventListener('keydown', (e) => {
                if (e.code === 'Space' && e.target === document.body) {
                    e.preventDefault();
                    this.toggleListen();
                }
                if (e.code === 'Escape') {
                    // 优先关闭设备管理弹窗
                    if (this.deviceManager.modal.classList.contains('show')) {
                        this.deviceManager.closeModal();
                    } else {
                        this.closePanel();
                    }
                }
            });
        }

        syncConfigForm() {
            $('#provider-select').value = this.config.provider;
            $('#api-key').value = this.config.apiKey;
            $('#api-base').value = this.config.apiBase;
            $('#model-name').value = this.config.model;
            $('#temperature').value = this.config.temperature;
            $('#max-tokens').value = this.config.maxTokens;
            $('#system-prompt').value = this.config.systemPrompt;
            $('#tts-toggle').checked = this.config.tts;
            $('#sys-stats-toggle').checked = !!this.config.showSystemStats;
            $('#wake-word-toggle').checked = this.config.wakeWord !== false;
            // 语音识别语言
            $('#stt-lang').value = this.config.sttLang || 'mixed';
            // 语音引擎
            $('#tts-engine').value = this.config.ttsEngine || 'edge';
            // 语音性别
            const gender = this.config.voiceGender === 'male' ? 'male' : 'female';
            const radio = document.querySelector(`input[name="voice-gender"][value="${gender}"]`);
            if (radio) radio.checked = true;
            // 在线音色列表（根据引擎填充对应音色）
            this.populateVoices(gender);
            // 语速/音调
            const rate = Number(this.config.voiceRate) || 1.0;
            const pitch = Number(this.config.voicePitch) || 1.0;
            $('#voice-rate').value = rate;
            $('#voice-pitch').value = pitch;
            $('#voice-rate-val').textContent = rate.toFixed(2);
            $('#voice-pitch-val').textContent = pitch.toFixed(2);
            // 引擎相关控件可见性
            this.updateVoiceSettingsVisibility();
        }

        /** 根据性别填充 Edge TTS 音色下拉列表 */
        populateVoices(gender) {
            const select = $('#se-voice-select');
            if (!select) return;
            // Edge TTS 神经网络音色
            const voices = SpeechSynth.EDGE_VOICES[gender] || SpeechSynth.EDGE_VOICES.female;
            const current = gender === 'male'
                ? (this.config.edgeVoiceMale || 'zh-CN-YunxiNeural')
                : (this.config.edgeVoiceFemale || 'zh-CN-XiaoxiaoNeural');
            select.innerHTML = voices.map(v =>
                `<option value="${v.value}"${v.value === current ? ' selected' : ''}>${v.label}</option>`
            ).join('');
        }

        /** 保留旧方法名兼容（内部转发到 populateVoices） */
        populateSEVoices(gender) {
            this.populateVoices(gender);
        }

        /** 根据引擎切换在线音色/音调控件的可见性 */
        updateVoiceSettingsVisibility() {
            const engine = this.config.ttsEngine || 'edge';
            const isBrowser = engine === 'browser';
            const seSettings = $('#se-voice-settings');
            const pitchItem = $('#pitch-item');
            const voiceLabel = seSettings ? seSettings.querySelector('label') : null;
            // 浏览器本地 TTS 不需要在线音色选择
            if (seSettings) seSettings.style.display = isBrowser ? 'none' : '';
            // 音调控件：浏览器 TTS 使用，Edge/SE 通过参数调节
            if (pitchItem) pitchItem.style.display = isBrowser ? '' : 'none';
            // 更新音色标签文案
            if (voiceLabel) {
                voiceLabel.textContent = engine === 'edge' ? '神经网络音色' : '在线音色';
            }
        }

        openPanel() {
            $('#config-panel').classList.add('open');
            $('#mask').classList.add('show');
            $('#config-panel').setAttribute('aria-hidden', 'false');
        }

        closePanel() {
            $('#config-panel').classList.remove('open');
            $('#mask').classList.remove('show');
            $('#config-panel').setAttribute('aria-hidden', 'true');
        }

        saveConfig() {
            ConfigManager.data.apiKey = $('#api-key').value.trim();
            ConfigManager.data.apiBase = $('#api-base').value.trim();
            ConfigManager.data.model = $('#model-name').value.trim();
            ConfigManager.data.temperature = parseFloat($('#temperature').value) || 0.7;
            ConfigManager.data.maxTokens = parseInt($('#max-tokens').value) || 1024;
            ConfigManager.data.systemPrompt = $('#system-prompt').value.trim();
            ConfigManager.data.tts = $('#tts-toggle').checked;
            ConfigManager.data.showSystemStats = $('#sys-stats-toggle').checked;
            // 语音引擎与音色
            ConfigManager.data.ttsEngine = $('#tts-engine').value || 'edge';
            const seVoice = $('#se-voice-select').value;
            const genderRadio = document.querySelector('input[name="voice-gender"]:checked');
            ConfigManager.data.voiceGender = genderRadio ? genderRadio.value : 'female';
            // 唤醒词开关
            ConfigManager.data.wakeWord = $('#wake-word-toggle').checked;
            // 语音识别语言
            ConfigManager.data.sttLang = $('#stt-lang').value || 'mixed';
            // 保存 Edge TTS 音色
            if (ConfigManager.data.voiceGender === 'male') {
                ConfigManager.data.edgeVoiceMale = seVoice || 'zh-CN-YunxiNeural';
            } else {
                ConfigManager.data.edgeVoiceFemale = seVoice || 'zh-CN-XiaoxiaoNeural';
            }
            ConfigManager.data.voiceRate = clamp(parseFloat($('#voice-rate').value) || 1.0, 0.5, 2.0);
            ConfigManager.data.voicePitch = clamp(parseFloat($('#voice-pitch').value) || 1.0, 0, 2.0);

            if (!ConfigManager.data.apiKey) {
                this.showPanelTip('请填写 API Key', true);
                return;
            }
            const ok = ConfigManager.save();
            this.config = ConfigManager.data;
            this.apiClient.setConfig(this.config);
            this.applyVoiceConfig();
            // 应用语音识别语言
            if (this.recognizer) this.recognizer.setMode(this.config.sttLang || 'mixed');
            this.showPanelTip(ok ? '配置已保存' : '保存失败', !ok);
            if (ok) setTimeout(() => this.closePanel(), 800);
        }

        resetConfig() {
            ConfigManager.reset();
            this.config = ConfigManager.data;
            this.apiClient.setConfig(this.config);
            this.applyVoiceConfig();
            this.syncConfigForm();
            // 恢复默认后根据配置启停唤醒词检测
            if (this.config.wakeWord !== false) {
                this.startWakeWord();
            } else {
                this.stopWakeWord();
            }
            this.showPanelTip('已恢复默认配置', false);
        }

        showPanelTip(msg, isError) {
            const tip = $('#panel-tip');
            tip.textContent = msg;
            tip.style.color = isError ? '#f87171' : 'var(--cyan)';
        }

        toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen?.().catch(() => {});
            } else {
                document.exitFullscreen?.();
            }
        }

        /* ---------- 唤醒词检测管理 ---------- */
        /**
         * 绑定首次用户手势激活（Chrome 要求 SpeechRecognition 必须在用户交互后启动）
         * 页面加载后显示提示，用户点击页面任意位置即激活唤醒词检测
         */
        bindWakeActivation() {
            if (!this.wakeDetector || !this.wakeDetector.supported) return;
            if (this.config.wakeWord === false) return;

            const activateHandler = () => {
                if (this.wakeActivated) return;
                this.wakeActivated = true;
                // 标记唤醒检测器已激活
                this.wakeDetector.activate();
                // 若当前处于空闲状态，启动唤醒词检测
                if (!this.busy && !this.autoListening) {
                    this.startWakeWord();
                }
                // 移除激活监听（仅需激活一次）
                document.removeEventListener('click', activateHandler);
                document.removeEventListener('keydown', activateHandler);
            };
            // 监听首次点击或按键（用户手势）
            document.addEventListener('click', activateHandler);
            document.addEventListener('keydown', activateHandler);

            // 显示激活提示
            this.setStatus('点击页面任意位置启用语音唤醒', 'idle');
        }

        /** 启动唤醒词检测（仅在空闲状态时运行） */
        startWakeWord() {
            if (!this.wakeDetector || !this.wakeDetector.supported) return;
            // 仅在空闲状态时启动唤醒词检测
            if (this.busy || this.autoListening) return;
            // 若配置未启用唤醒词，则不启动
            if (this.config.wakeWord === false) {
                this.setStatus('点击麦克风开始对话');
                return;
            }
            // 若尚未通过用户手势激活，则等待激活
            if (!this.wakeActivated) {
                this.setStatus('点击页面任意位置启用语音唤醒', 'idle');
                return;
            }
            this.wakeDetector.activate();
            this.wakeDetector.start();
            this.setStatus('等待唤醒词 "Hi Seven" / "你好小七"...', 'idle');
            this.particles.setState('idle');
        }

        /** 停止唤醒词检测 */
        stopWakeWord() {
            if (this.wakeDetector) this.wakeDetector.stop();
        }

        /** TTS 播放时同时启动唤醒词检测，支持语音打断 */
        _speakWithWakeWord(text, onEnd) {
            // 启动唤醒词检测（TTS 播放期间允许打断）
            this.startWakeWord();
            // 播放语音
            this.synth.speak(text, () => {
                // TTS 播放完成后停止唤醒词检测
                this.stopWakeWord();
                onEnd && onEnd();
            });
        }

        /** 唤醒词触发回调：开始对话，若 TTS 正在播放则打断 */
        onWakeWord() {
            // 如果 TTS 正在播放，打断 TTS 并开始倾听
            if (this.synth && !this.synth.stopped && this.synth._onEndCallback) {
                console.log('[唤醒词] TTS 播放中，打断 TTS');
                this.synth.cancelTTS();
                this.particles.setVolume(0);
                this.updateVuMeter(0);
                showToast('语音输出已打断，开始对话');
                this.startConversation();
                return;
            }
            // 正常唤醒流程
            showToast('唤醒成功，开始对话');
            this.startConversation();
        }

        /* ---------- 15秒无语音超时管理 ---------- */
        /** 启动监听超时定时器（15秒无语音内容自动关闭） */
        startListenTimeout() {
            this.clearListenTimeout();
            this.listenTimeout = setTimeout(() => {
                this.listenTimeout = null;
                // 超时处理：停止听取
                this.autoListening = false;
                this.listenStarting = false;
                this.recognizer.stop();
                showToast('15秒未检测到语音，已自动关闭');
                // 清理 UI 状态
                $('#mic-btn').classList.remove('recording');
                $('#mic-hint').textContent = '点击开始';
                $('#vu-meter').classList.remove('active');
                this.analyser.stop();
                this.particles.setVolume(0);
                // 恢复空闲状态，并重新启动唤醒词检测
                this.setStatus('点击麦克风开始对话');
                this.particles.setState('idle');
                this.startWakeWord();
            }, this.listenTimeoutMs);
        }

        /** 清除监听超时定时器 */
        clearListenTimeout() {
            if (this.listenTimeout) {
                clearTimeout(this.listenTimeout);
                this.listenTimeout = null;
            }
        }

        /** 重置监听超时定时器（收到语音内容时调用） */
        resetListenTimeout() {
            if (this.listenTimeout) {
                this.startListenTimeout();
            }
        }

        /* ---------- 语音识别流程 ---------- */
        async toggleListen() {
            // 用户点击麦克风按钮，作为有效的用户手势激活唤醒词功能
            if (!this.wakeActivated && this.wakeDetector) {
                this.wakeActivated = true;
                this.wakeDetector.activate();
            }
            // 处理中（思考/说话），点击则中断当前流程
            if (this.busy) {
                this.stopAll();
                return;
            }
            // 正在异步启动监听（过渡态）：点击则取消本次启动，回到空闲
            // 避免在 mic-hint 显示"点击停止"但识别器尚未真正启动时点击无效
            if (this.listenStarting) {
                console.log('[麦克风] 监听启动中，取消本次启动');
                this.listenStarting = false;
                this.autoListening = false;
                this.clearListenTimeout();
                this.analyser.stop();
                this.recognizer.stop();
                $('#mic-btn').classList.remove('recording');
                $('#mic-hint').textContent = '点击开始';
                $('#vu-meter').classList.remove('active');
                this.particles.setVolume(0);
                this.setStatus('点击麦克风开始对话');
                this.particles.setState('idle');
                this.startWakeWord();
                return;
            }
            // TTS 播放中点击：停止 TTS、释放麦克风资源、再启动唤醒词检测
            // 此时 busy 为 false 但语音仍在输出，需停止 TTS 并恢复唤醒词检测
            if (this.synth && !this.synth.stopped && this.synth._onEndCallback) {
                console.log('[麦克风] TTS 播放中，打断 TTS，释放资源后启动唤醒词检测');
                this.synth.cancelTTS();
                this.particles.setVolume(0);
                this.updateVuMeter(0);
                // 停止唤醒词检测（TTS 播放期间会启动唤醒词监听），释放麦克风
                this.stopWakeWord();
                // 确保音量分析的麦克风资源已释放
                this.analyser.stop();
                // 恢复 UI：显示过渡状态，等待资源释放后进入唤醒词检测
                $('#mic-btn').classList.remove('recording');
                $('#mic-hint').textContent = '点击开始';
                $('#vu-meter').classList.remove('active');
                this.setStatus('正在停止语音输出...', 'idle');
                this.particles.setState('idle');
                // 等待麦克风资源完全释放后，启动唤醒词检测
                // 500ms 确保 analyser 的 stream tracks 和 wakeDetector 的 recognition 都已停止
                setTimeout(() => {
                    // 仅在仍处于空闲态时恢复唤醒词（用户可能已再次点击开始倾听）
                    if (!this.busy && !this.recognizer.listening && !this.listenStarting) {
                        this.startWakeWord();
                    }
                }, 500);
                return;
            }
            // 正在聆听时点击则停止，并退出自动听取模式
            if (this.recognizer.listening) {
                this.autoListening = false;
                this.clearListenTimeout();
                this.recognizer.stop();
                return;
            }
            if (!this.recognizer.supported) {
                showToast('当前浏览器不支持语音识别，建议使用 Chrome');
                return;
            }
            if (!this.config.apiKey) {
                showToast('请先在设置中配置 API Key');
                this.openPanel();
                return;
            }

            // 手动启动时停止唤醒词检测，避免麦克风冲突
            this.stopWakeWord();
            // 标记进入异步启动过渡态，期间点击麦克风可取消
            this.listenStarting = true;
            // 等待唤醒词检测器完全释放麦克风（recognition.stop() 是异步的）
            await new Promise(r => setTimeout(r, 400));
            // 启动过程中被用户点击取消，则直接退出
            if (!this.listenStarting) return;

            // 启动音量分析
            const ok = await this.analyser.start();
            if (!this.listenStarting) return;  // 启动已被取消
            if (!ok) {
                this.listenStarting = false;
                showToast('麦克风访问失败，请检查权限');
                // 麦克风失败时恢复唤醒词检测
                this.startWakeWord();
                return;
            }

            this.setStatus('正在聆听...', 'active');
            $('#mic-btn').classList.add('recording');
            $('#mic-hint').textContent = '点击停止';
            $('#vu-meter').classList.add('active');
            this.particles.setState('listening');

            this.recognizer.start();
            // 识别器已启动，退出过渡态
            this.listenStarting = false;
            // 启动15秒无语音超时
            this.startListenTimeout();
        }

        /** 唤醒词触发后开始对话（跳过 toggle 逻辑，直接进入听取模式） */
        async startConversation() {
            if (!this.recognizer.supported) {
                showToast('当前浏览器不支持语音识别，建议使用 Chrome');
                return;
            }
            if (!this.config.apiKey) {
                showToast('请先在设置中配置 API Key');
                this.openPanel();
                return;
            }
            // 唤醒词检测已在 onWakeWord 中停止，但 recognition.stop() 是异步的，
            // 需等待其完全释放麦克风后再启动主识别器，避免两个 SpeechRecognition 实例冲突
            this.listenStarting = true;
            await new Promise(r => setTimeout(r, 500));
            if (!this.listenStarting) return;  // 启动已被取消

            const ok = await this.analyser.start();
            if (!this.listenStarting) return;  // 启动已被取消
            if (!ok) {
                this.listenStarting = false;
                showToast('麦克风访问失败，请检查权限');
                this.startWakeWord();
                return;
            }

            // 标记为自动听取模式，避免识别器空结束时回到唤醒词模式
            this.autoListening = true;
            this.setStatus('正在聆听...', 'active');
            $('#mic-btn').classList.add('recording');
            $('#mic-hint').textContent = '点击停止';
            $('#vu-meter').classList.add('active');
            this.particles.setState('listening');

            this.recognizer.start();
            this.listenStarting = false;
            // 启动15秒无语音超时
            this.startListenTimeout();
        }

        onRecognizeInterim(text) {
            // 实时更新用户消息气泡（流式识别）
            this.appendUserInterim(text);
            // 收到语音内容时重置15秒超时定时器
            this.resetListenTimeout();
        }

        onRecognizeEnd(text) {
            $('#mic-btn').classList.remove('recording');
            $('#mic-hint').textContent = '点击开始';
            $('#vu-meter').classList.remove('active');
            this.analyser.stop();
            this.particles.setVolume(0);
            // 清除超时定时器
            this.clearListenTimeout();

            const finalText = (text || '').trim();
            if (!finalText) {
                // 澄清模式下空响应：保持上下文，重启识别器继续等待回答
                if (this.pendingClarify) {
                    setTimeout(() => {
                        if (!this.pendingClarify) return;
                        try { this.recognizer.start(); } catch (e) { /* ignore */ }
                    }, 300);
                    return;
                }
                // 无识别结果：若处于自动听取模式则重启识别器继续等待，否则回到空闲
                if (this.autoListening) {
                    // 空重启计数：防止麦克风异常时无限重启循环
                    this.emptyRestartCount = (this.emptyRestartCount || 0) + 1;
                    if (this.emptyRestartCount > 3) {
                        // 连续多次空重启，可能是麦克风异常，退出自动听取模式
                        console.warn('[识别] 连续空重启超过 3 次，退出自动听取模式');
                        this.autoListening = false;
                        this.emptyRestartCount = 0;
                        this.setStatus('点击麦克风开始对话');
                        this.particles.setState('idle');
                        this.startWakeWord();
                        return;
                    }
                    // 自动听取模式：短暂延迟后重启识别器，继续等待用户说话
                    setTimeout(() => {
                        if (!this.autoListening) return;
                        this.recognizer.start();
                        this.startListenTimeout();
                    }, 300);
                } else {
                    this.setStatus('点击麦克风开始对话');
                    this.particles.setState('idle');
                    // 回到空闲状态时恢复唤醒词检测
                    this.startWakeWord();
                }
                return;
            }
            // 收到有效语音内容，重置空重启计数
            this.emptyRestartCount = 0;
            // 定稿用户消息
            this.appendUserFinal(finalText);
            // 智控 Agent：智能匹配设备指令（模糊匹配+代词+澄清），命中则直接执行
            if (this.handleSmartControl(finalText)) {
                return;
            }
            // 先检测本地控制指令（关闭状态、清空面板等），匹配则不发送给 AI
            if (this.handleLocalCommand(finalText)) {
                return;
            }
            // 发送给 AI
            this.sendToAI(finalText);
        }

        onRecognizeError(err) {
            console.warn('识别错误:', err);
            // "already started" 是可恢复的并发问题，不中断流程
            if (err && typeof err === 'string' &&
                (err.includes('already started') || err.includes('being started'))) {
                console.warn('[识别] 识别器并发启动，忽略此错误');
                return;
            }
            $('#mic-btn').classList.remove('recording');
            $('#mic-hint').textContent = '点击开始';
            $('#vu-meter').classList.remove('active');
            this.analyser.stop();
            this.particles.setVolume(0);
            this.clearListenTimeout();
            if (err === 'unsupported') {
                showToast('浏览器不支持语音识别');
            } else if (err === 'not-allowed') {
                showToast('麦克风权限被拒绝');
            } else if (err !== 'no-speech' && err !== 'aborted') {
                showToast('识别错误: ' + err);
            }
            this.autoListening = false;
            this.setStatus('点击麦克风开始对话');
            this.particles.setState('idle');
            // 出错后恢复唤醒词检测
            this.startWakeWord();
        }

        /* ---------- 本地控制指令 ---------- */
        /**
         * 检测并处理本地控制指令（不发送给 AI）
         * 支持指令：
         * - 关闭/显示电脑状态（系统状态框）
         * - 清空/关闭系统控制（指令面板）
         * - 清空对话记录
         * @param {string} text 用户语音识别文本
         * @returns {boolean} true 表示已处理本地指令，无需发送给 AI
         */
        handleLocalCommand(text) {
            if (!text) return false;
            const lower = text.toLowerCase().trim();

            // 1. 关闭电脑状态（隐藏系统状态框）
            if (/(关闭|隐藏|关掉|关上)(电脑|系统)?(状态|监控|运行状态|信息)/.test(text) ||
                /(turn off|hide|close).*(system|status|monitor|stats)/i.test(lower)) {
                this.config.showSystemStats = false;
                this.applySystemStatsVisibility();
                const toggle = $('#sys-stats-toggle');
                if (toggle) toggle.checked = false;
                this.speakLocalResult('已关闭电脑状态');
                return true;
            }
            // 显示电脑状态（开启系统状态框）
            if (/(显示|打开|开启|启动)(电脑|系统)?(状态|监控|运行状态|信息)/.test(text) ||
                /(show|open|enable|turn on).*(system|status|monitor|stats)/i.test(lower)) {
                this.config.showSystemStats = true;
                this.applySystemStatsVisibility();
                const toggle = $('#sys-stats-toggle');
                if (toggle) toggle.checked = true;
                this.speakLocalResult('已开启电脑状态');
                return true;
            }

            // 2. 清空/关闭系统控制（指令面板）
            if (/(清空|清除|关闭|关掉|清掉)(系统)?(控制|指令|命令|面板|操作)/.test(text) ||
                /(clear|close|reset).*(command|system|panel|control)/i.test(lower)) {
                if (this.cmdManager) {
                    this.cmdManager.clearList();
                }
                // 同步清空内容展示区（销毁图表实例）
                if (this.contentDisplay) {
                    this.contentDisplay.clear();
                }
                this.speakLocalResult('已清空系统控制');
                return true;
            }

            // 3. 清空对话记录
            if (/(清空|清除|删除|清掉|清零)(对话|聊天|记录|历史|消息)/.test(text) ||
                /(clear).*(chat|history|conversation|messages?)/i.test(lower)) {
                this.clearChat();
                this.speakLocalResult('已清空对话记录');
                return true;
            }

            return false;
        }

        /** 本地控制指令执行结果的语音反馈 */
        speakLocalResult(text) {
            this.setStatus('语音输出中...', 'speaking');
            this.particles.setState('speaking');
            if (this.config.tts && this.config.ttsEngine === 'browser') {
                this.simulateSpeakingVolume();
            }
            if (this.config.tts && text && text.trim()) {
                this.synth.speak(text, () => this.finishSpeak());
            } else {
                this.finishSpeak();
            }
        }

        /* ---------- 调用 AI ---------- */
        /** 手动输入发送消息：与语音识别共用同一处理流程（智控/本地指令/AI） */
        _sendManualMessage() {
            const input = $('#chat-input');
            const text = (input.value || '').trim();
            if (!text) return;
            // 处理中（思考/语音输出）时禁止重复提交
            if (this.busy) {
                showToast('正在处理中，请稍候');
                return;
            }
            input.value = '';
            // 定稿用户消息气泡
            this.appendUserFinal(text);
            // 与 onRecognizeEnd 共用同一路由链
            if (this.handleSmartControl(text)) return;
            if (this.handleLocalCommand(text)) return;
            this.sendToAI(text);
        }

        async sendToAI(userText) {
            this.busy = true;
            this.setStatus('思考中...', 'thinking');
            this.particles.setState('thinking');
            // 进入思考阶段不再监听麦克风音量，释放 getUserMedia 资源
            // 避免与 TTS 播放期间的唤醒词识别器、以及后续 startAutoListen 重新获取麦克风冲突
            // 冲突会导致识别器无法拿到麦克风、识别不到文字
            this.analyser.stop();
            this.particles.setVolume(0);
            this.updateVuMeter(0);
            // 创建 AI 消息气泡（流式填充）
            this.appendAiChunk('');

            // 优先尝试智控设备直接执行（绕过 LLM，快速响应）
            // 适用于"返回"、"启动系统设置"等不含设备类型关键词但有上次设备的指令
            try {
                const execResp = await fetch('/api/agent/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: userText,
                        lastDeviceId: this.deviceManager ? this.deviceManager.lastDeviceId || '' : ''
                    })
                });
                const execData = await execResp.json();
                if (execData.agent === 'smart_home' && execData.action_type !== 'classified') {
                    // 智控设备直接处理结果，不走 LLM 流程
                    console.log('[Agent执行] 智控设备直接处理:', execData.action_type);
                    this.busy = false;
                    this.setStatus('就绪', 'idle');
                    this.particles.setState('idle');

                    const result = await this.deviceManager._handleUnifiedResult(execData);
                    // 优先使用后端返回的消息，其次使用执行结果消息，最后使用默认消息
                    const msg = execData.message
                        || (result && result.message)
                        || '正在执行';
                    this.finalizeAiMessage();
                    this.history.push({ role: 'assistant', content: msg });
                    if (this.history.length > 10) this.history = this.history.slice(-10);

                    // 语音播报
                    if (this.speaking && this.config.tts && msg && msg.trim()) {
                        this.setStatus('语音输出中...', 'speaking');
                        this.particles.setState('speaking');
                        if (this.config.ttsEngine === 'browser') {
                            this.simulateSpeakingVolume();
                        }
                        this._speakWithWakeWord(msg, () => this.finishSpeak());
                    } else {
                        this.finishSpeak();
                    }
                    return;
                }
            } catch (e) {
                console.warn('[Agent执行] 智控预检失败，继续走 LLM 流程:', e.message);
            }

            // 主 Agent 路由：调用后端 /api/agent/route 获取分类与系统提示词
            let agentType = 'basic';
            let systemPrompt = this.config.systemPrompt;
            try {
                const resp = await fetch('/api/agent/route', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: userText,
                        basePrompt: this.config.systemPrompt
                    })
                });
                const data = await resp.json();
                agentType = data.agent || 'basic';
                systemPrompt = data.systemPrompt || this.config.systemPrompt;
                console.log('[Agent路由] 分类:', agentType, '| 角色:', data.name);
                // 在内容展示区标记当前 Agent 角色
                this.contentDisplay.setAgentBadge(agentType);
            } catch (e) {
                console.warn('[Agent路由] 后端调用失败，降级为本地分类:', e.message);
                // 降级：使用本地 AgentRouter.classify
                const localIntent = this.agentRouter.classify(userText);
                const map = { system: 'local', search: 'basic', chat: 'basic' };
                agentType = map[localIntent] || 'basic';
                this.contentDisplay.setAgentBadge(agentType);
            }

            // 联网查询类（本地分类为 search 时）：先搜索，将结果注入上下文
            // 保留原有 AgentRouter 的联网搜索能力
            const localIntent = this.agentRouter.classify(userText);
            let searchContext = '';
            if (localIntent === 'search') {
                this.setStatus('联网搜索中...', 'thinking');
                try {
                    // 限时5秒，避免搜索接口长时间阻塞
                    const searchResp = await Promise.race([
                        this.agentRouter.search(userText),
                        new Promise(resolve => setTimeout(() =>
                            resolve({ success: false, results: [], error: '搜索超时' }), 5000))
                    ]);
                    if (searchResp.success && searchResp.results.length > 0) {
                        searchContext = this.agentRouter.formatSearchContext(searchResp.results);
                        console.log('[Agent路由] 搜索成功，命中', searchResp.results.length, '条结果');
                    } else {
                        console.log('[Agent路由] 搜索失败或无结果:', searchResp.error);
                        // 搜索失败时提示 LLM 自行回答
                        searchContext = '联网搜索失败，请根据你的知识直接回答用户问题。';
                    }
                } catch (searchErr) {
                    console.log('[Agent路由] 搜索异常:', searchErr.message);
                    searchContext = '联网搜索失败，请根据你的知识直接回答用户问题。';
                }
            }

            // 构造消息
            const messages = [{ role: 'system', content: systemPrompt }];
            if (searchContext) {
                messages.push({ role: 'system', content: searchContext });
            }
            this.history.push({ role: 'user', content: userText });
            messages.push(...this.history);

            let aiText = '';
            try {
                // 查询重试机制：最多 2 次，防止死循环
                const MAX_QUERY_RETRIES = 2;
                let queryAttempts = 0;
                let gotValidResponse = false;
                let lastErrorMsg = '';  // 记录最后一次错误信息，用于精准提示

                while (queryAttempts < MAX_QUERY_RETRIES && !gotValidResponse) {
                    queryAttempts++;
                    aiText = '';
                    try {
                        this.setStatus(queryAttempts > 1
                            ? `重新查询中(${queryAttempts}/${MAX_QUERY_RETRIES})...`
                            : '思考中...', 'thinking');
                        await this.apiClient.chat(messages, (chunk) => {
                            aiText += chunk;
                            // 流式显示：剥离已闭合的内容块标记，未闭合的保留原文
                            // 这样代码块在生成过程中显示在气泡里，闭合后自动移到展示区
                            const { cleanText } = this.parseContentBlocks(aiText);
                            this.appendAiChunk(cleanText);
                        });
                        // 检查回复是否有效（非空且非纯空白）
                        if (aiText && aiText.trim()) {
                            gotValidResponse = true;
                        } else {
                            console.warn(`[查询] 第 ${queryAttempts} 次查询返回空结果`);
                            lastErrorMsg = 'API 返回空结果，可能是模型未生成内容';
                        }
                    } catch (retryErr) {
                        console.warn(`[查询] 第 ${queryAttempts} 次查询失败:`, retryErr.message);
                        lastErrorMsg = retryErr.message || '未知错误';
                        aiText = '';
                    }
                }

                // 超过最大重试次数仍无有效结果，回复无法回答
                if (!gotValidResponse) {
                    // 根据错误类型给出精准提示，帮助用户定位问题
                    let hint = '请检查 API 配置或稍后重试';
                    if (lastErrorMsg.includes('API Key')) {
                        hint = '请先在设置中配置 API Key';
                    } else if (lastErrorMsg.includes('API Base URL')) {
                        hint = '请先在设置中配置 API Base URL';
                    } else if (lastErrorMsg.includes('401') || lastErrorMsg.includes('Unauthorized')) {
                        hint = 'API Key 无效或已过期，请检查密钥配置';
                    } else if (lastErrorMsg.includes('403') || lastErrorMsg.includes('Forbidden')) {
                        hint = 'API 访问被拒绝，请检查账户权限或余额';
                    } else if (lastErrorMsg.includes('404')) {
                        hint = 'API 地址不存在，请检查 Base URL 是否正确';
                    } else if (lastErrorMsg.includes('429')) {
                        hint = 'API 请求频率超限，请稍后重试或检查套餐额度';
                    } else if (lastErrorMsg.includes('500') || lastErrorMsg.includes('502') || lastErrorMsg.includes('503')) {
                        hint = 'API 服务端异常，请稍后重试';
                    } else if (lastErrorMsg.includes('Failed to fetch') || lastErrorMsg.includes('NetworkError')) {
                        hint = '网络连接失败，请检查网络或 API 地址是否可达';
                    } else if (lastErrorMsg.includes('空结果')) {
                        hint = 'API 返回空结果，请检查模型名称是否正确';
                    }
                    aiText = `抱歉，请求失败：${hint}。详细错误：${lastErrorMsg}`;
                    this.appendAiChunk(aiText);
                    this.history.push({ role: 'assistant', content: aiText });
                    if (this.history.length > 10) this.history = this.history.slice(-10);
                    this.finalizeAiMessage();
                    this.setStatus('点击麦克风开始对话');
                    this.particles.setState('idle');
                    this.busy = false;
                    if (this.config.tts) {
                        this._speakWithWakeWord(aiText, () => this.finishSpeak());
                    } else {
                        this.finishSpeak();
                    }
                    return;
                }

                // 解析统一内容块 <<CONTENT type="...">>...<<END>>（同时兜底 Markdown 代码块/图片）
                const { cleanText, blocks } = this.parseContentBlocks(aiText);

                // 兼容旧格式 <<SYS_CMD>>cmd<<END_SYS_CMD>>：合并到 blocks 中作为 command 类型
                const legacy = this.cmdManager.parseCommands(aiText);
                legacy.commands.forEach(cmd => {
                    blocks.push({ type: 'command', command: cmd, confirm: 'auto' });
                });

                // local agent 兜底：AI 未使用任何标记格式，但纯文本中包含命令行时提取执行
                // 仅当当前无 command 类型块、且 agent 为 local 时才提取，避免误触发
                let textForDisplay = cleanText;  // 用于对话气泡显示的文本（提取命令后会更新）
                const hasCommandBlock = blocks.some(b => b.type === 'command');
                if (!hasCommandBlock && agentType === 'local') {
                    const extractedCmds = this.contentDisplay.extractCommandsFromText(cleanText);
                    if (extractedCmds.length > 0) {
                        extractedCmds.forEach(cmd => {
                            blocks.push({ type: 'command', command: cmd, confirm: 'auto' });
                        });
                        // 从显示文本中移除已提取的命令行，避免对话气泡重复显示
                        textForDisplay = cleanText
                            .split('\n')
                            .filter(line => !extractedCmds.includes(line.trim()))
                            .join('\n')
                            .replace(/\n{3,}/g, '\n\n')
                            .trim();
                    }
                }

                // 最终纯文本：优先使用 parseContentBlocks 的结果（已剥离 markdown 与 <<CONTENT>>）
                // 仅当 legacy.cleanText 更短时（理论上不会，因为 cleanText 已包含 legacy 的剥离）
                // 取较短的，确保剥离更彻底
                const finalCleanText = textForDisplay.length <= legacy.cleanText.length
                    ? textForDisplay : legacy.cleanText;

                // 在对话气泡中显示最终纯文本
                if (blocks.length > 0 || legacy.commands.length > 0) {
                    this.appendAiChunk(finalCleanText || '正在处理...');
                }

                // 将内容块分发到内容展示区
                let cmdResults = [];   // 指令执行结果，用于语音播报判断
                for (const block of blocks) {
                    if (block.type === 'command') {
                        // 执行系统指令（cmdManager 内部已通过 appendCommand 在面板显示指令状态）
                        this.setStatus('执行系统指令...', 'thinking');
                        const result = await this.cmdManager.executeCommand(block.command);
                        cmdResults.push({ command: block.command, result });
                        // 若指令是 cat/open 类文件操作且执行成功，额外加载文件内容展示
                        const filePath = this.contentDisplay.extractFilePath(block.command);
                        if (filePath && result.success) {
                            this.contentDisplay.addItem({ type: 'file', path: filePath });
                        }
                    } else if (block.type === 'code') {
                        this.contentDisplay.addItem({
                            type: 'code',
                            lang: block.lang,
                            content: block.content
                        });
                    } else if (block.type === 'image') {
                        this.contentDisplay.addItem({
                            type: 'image',
                            src: block.src,
                            mime: block.mime,
                            content: block.content,
                            name: block.name
                        });
                    } else if (block.type === 'chart') {
                        this.contentDisplay.addItem({
                            type: 'chart',
                            chartType: block.chartType,
                            title: block.title,
                            data: block.data
                        });
                    } else if (block.type === 'file') {
                        this.contentDisplay.addItem({
                            type: 'file',
                            path: block.path
                        });
                    } else if (block.type === 'device') {
                        this.setStatus('执行设备控制...', 'thinking');
                        await this.deviceManager.executeDeviceControl(block);
                    }
                }

                // 构造存入历史的文本（含执行结果摘要）
                let assistantText = finalCleanText;
                if (cmdResults.length > 0) {
                    const resultSummary = this.formatCommandResults(cmdResults);
                    if (resultSummary) {
                        assistantText = (finalCleanText || '系统操作完成') + '\n\n' + resultSummary;
                        this.appendAiChunk(assistantText);
                    }
                }

                // 将最终回复（含执行结果）存入历史
                this.history.push({ role: 'assistant', content: assistantText });
                if (this.history.length > 10) this.history = this.history.slice(-10);

                this.finalizeAiMessage();

                // 语音播报：根据执行结果调整播报内容
                let speakText;
                if (cmdResults.length > 0) {
                    const hasCancelled = cmdResults.some(r => r.result.cancelled);
                    const hasFailed = cmdResults.some(r => !r.result.success && !r.result.cancelled);
                    if (hasCancelled) {
                        speakText = '操作已取消。';
                    } else if (hasFailed) {
                        speakText = '操作执行失败。';
                    } else {
                        speakText = finalCleanText || '系统操作已完成';
                    }
                } else {
                    speakText = finalCleanText;
                }

                this.setStatus('语音输出中...', 'speaking');
                this.particles.setState('speaking');

                // TTS 防御：剔除残留的内容块标记和 markdown 代码块，只播报自然语言
                const ttsText = this.sanitizeForTTS(speakText);

                if (this.config.tts && ttsText && ttsText.trim()) {
                    if (this.config.ttsEngine === 'browser') {
                        this.simulateSpeakingVolume();
                    }
                    this._speakWithWakeWord(ttsText, () => {
                        this.finishSpeak();
                    });
                } else {
                    this.finishSpeak();
                }
            } catch (e) {
                console.error(e);
                this.appendAiChunk('请求失败: ' + e.message);
                this.finalizeAiMessage();
                this.setStatus('点击麦克风开始对话');
                this.particles.setState('idle');
                this.busy = false;
                this.startWakeWord();
            }
        }

        /** 清理文本用于 TTS 语音播报：剔除代码块、内容标记、URL 等 */
        sanitizeForTTS(text) {
            if (!text) return '';
            let result = text;
            // 剔除 <<CONTENT ...>>...<<END>> 标记块
            result = result.replace(/<<CONTENT\s+[^>]*>>[\s\S]*?<<END>>/g, '');
            // 剔除 <<SYS_CMD>>...<<END_SYS_CMD>> 标记块
            result = result.replace(/<<SYS_CMD>>[\s\S]*?<<END_SYS_CMD>>/g, '');
            // 剔除 markdown 代码块 ```lang\n...\n```
            result = result.replace(/```[\w+-]*[ \t]*\r?\n[\s\S]*?```/g, '');
            // 剔除行内代码 `code`
            result = result.replace(/`[^`]+`/g, '');
            // 剔除 markdown 图片语法 ![alt](url)
            result = result.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
            // 剔除裸 URL
            result = result.replace(/https?:\/\/[^\s)]+/g, '');
            // 剔除 markdown 标题/列表标记
            result = result.replace(/^#{1,6}\s+/gm, '');
            result = result.replace(/^[-*+]\s+/gm, '');
            // 合并多余空行
            result = result.replace(/\n{3,}/g, '\n\n').trim();
            return result;
        }

        /* ---------- 智控设备语音控制 ---------- */

        /**
         * 智控 Agent 入口：处理语音识别文本，智能匹配设备并执行/澄清
         * @returns {boolean} 是否被智控流程消费（true 表示已处理，不再发给 AI）
         */
        handleSmartControl(text) {
            if (!this.deviceManager) return false;
            const allDevices = (this.deviceManager.devices || []).concat(this.deviceManager.cloudDevices || []);
            if (allDevices.length === 0) return false;

            // 若有待澄清上下文，优先处理用户的澄清回答
            if (this.pendingClarify) {
                return this._handleClarifyResponse(text);
            }

            const match = this.deviceManager.smartMatchCommand(text);
            switch (match.type) {
                case 'execute':
                    this._executeSmartDevice(match);
                    return true;
                case 'clarify_device':
                    this._askClarifyDevice(match);
                    return true;
                case 'clarify_command':
                    this._askClarifyCommand(match);
                    return true;
                default:
                    return false;
            }
        }

        /** 执行已确定的设备控制 */
        async _executeSmartDevice(match) {
            const device = match.device;
            const cmd = match.cmd;
            const customValue = match.customValue;
            // 记住上下文
            this.deviceManager.lastDeviceId = device.id;

            this.busy = true;
            this.setStatus(`控制${device.name}...`, 'thinking');
            this.particles.setState('thinking');
            // 释放麦克风音量分析，避免与后续 TTS 播放/唤醒词识别冲突
            this.analyser.stop();
            this.particles.setVolume(0);
            this.updateVuMeter(0);

            const cmdName = cmd.name || cmd.action;
            const intent = (customValue !== null && customValue !== undefined)
                ? `正在控制 ${device.name}：${cmdName} 设为 ${customValue}`
                : `正在控制 ${device.name}：${cmdName}`;
            this.appendAiChunk(intent);
            this.finalizeAiMessage();

            const ctrlParam = (customValue !== null && customValue !== undefined)
                ? { custom_value: customValue }
                : {};
            const result = await this.deviceManager.executeControl(
                device.id, cmd.action, null, ctrlParam
            );

            let speakText;
            if (result.success) {
                speakText = (customValue !== null && customValue !== undefined)
                    ? `已将${device.name}的${cmdName}设为${customValue}`
                    : `已${cmdName}：${device.name}`;
            } else {
                speakText = `${device.name}控制失败：${result.error || '请检查设备是否在线'}`;
            }
            this.appendAiChunk(speakText);
            this.finalizeAiMessage();
            this.history.push({ role: 'user', content: `${device.name} ${cmdName}` });
            this.history.push({ role: 'assistant', content: speakText });
            if (this.history.length > 10) this.history = this.history.slice(-10);

            this.setStatus('语音输出中...', 'speaking');
            this.particles.setState('speaking');
            if (this.config.tts && speakText) {
                if (this.config.ttsEngine === 'browser') this.simulateSpeakingVolume();
                this.synth.speak(speakText, () => this.finishSpeak());
            } else {
                this.finishSpeak();
            }
        }

        /** 多设备候选：询问用户选择哪个设备 */
        _askClarifyDevice(match) {
            const candidates = match.candidates || [];
            if (candidates.length === 0) return;

            this.pendingClarify = {
                mode: 'device',
                candidates: candidates,
                customValue: match.customValue
            };

            const names = candidates.map((c, i) => `${i + 1}.${c.device.name}`).join('  ');
            const speakText = `找到了多个设备，请说要控制哪个：${names}`;

            this.busy = true;
            this.setStatus('等待选择设备...', 'thinking');
            this.particles.setState('thinking');
            this.appendAiChunk(speakText);
            this.finalizeAiMessage();

            this.setStatus('语音输出中...', 'speaking');
            this.particles.setState('speaking');
            if (this.config.tts && speakText) {
                if (this.config.ttsEngine === 'browser') this.simulateSpeakingVolume();
                this.synth.speak(speakText, () => this._startClarifyListen());
            } else {
                this._startClarifyListen();
            }
        }

        /** 命令不明确：询问用户要执行什么操作 */
        _askClarifyCommand(match) {
            const device = match.device;
            const commands = (device.commands || []).filter(c => c.name);
            if (commands.length === 0) return;

            // 设备已识别即绑定上下文，后续直接说动作（如"向右"）可沿用此设备
            // 否则后续动作指令会因无 lastDeviceId 而提示"未指定设备"
            this.deviceManager.lastDeviceId = device.id;

            this.pendingClarify = {
                mode: 'command',
                device: device
            };

            const cmdNames = commands.map((c, i) => `${i + 1}.${c.name}`).join('  ');
            const speakText = `${device.name}支持以下操作：${cmdNames}，请说要执行哪个`;

            this.busy = true;
            this.setStatus('等待选择操作...', 'thinking');
            this.particles.setState('thinking');
            this.appendAiChunk(speakText);
            this.finalizeAiMessage();

            this.setStatus('语音输出中...', 'speaking');
            this.particles.setState('speaking');
            if (this.config.tts && speakText) {
                if (this.config.ttsEngine === 'browser') this.simulateSpeakingVolume();
                this.synth.speak(speakText, () => this._startClarifyListen());
            } else {
                this._startClarifyListen();
            }
        }

        /** 启动一次语音识别接收澄清回答 */
        _startClarifyListen() {
            this.busy = false;
            this.setStatus('请说出您的选择...', 'listening');
            this.particles.setState('listening');
            try {
                this.recognizer.start();
                this.startListenTimeout();
            } catch (e) {
                console.warn('[智控] 澄清识别启动失败:', e);
            }
        }

        /** 处理澄清回答 */
        _handleClarifyResponse(text) {
            const ctx = this.pendingClarify;
            this.pendingClarify = null;
            const lower = text.toLowerCase().trim();

            if (ctx.mode === 'device') {
                // 按序号或名称匹配候选设备
                let selected = null;
                const num = this.deviceManager.chineseToNumber(text);
                if (num && num >= 1 && num <= ctx.candidates.length) {
                    selected = ctx.candidates[num - 1];
                }
                if (!selected) {
                    // 按名称模糊匹配
                    for (const cand of ctx.candidates) {
                        const name = (cand.device.name || '').toLowerCase();
                        if (name && lower.includes(name)) {
                            selected = cand;
                            break;
                        }
                        // 名称字符命中率
                        const chars = cand.device.name.split('');
                        let hit = 0;
                        for (const ch of chars) if (text.includes(ch)) hit++;
                        if (hit / chars.length >= 0.5) {
                            selected = cand;
                            break;
                        }
                    }
                }
                if (selected) {
                    this._executeSmartDevice({
                        device: selected.device,
                        cmd: selected.cmd,
                        customValue: ctx.customValue
                    });
                } else {
                    this.appendAiChunk('未识别到选择的设备，请重新说出指令');
                    this.finalizeAiMessage();
                    this.finishSpeak();
                }
                return true;
            }

            if (ctx.mode === 'command') {
                const device = ctx.device;
                const commands = (device.commands || []).filter(c => c.name);
                let selected = null;
                // 优先按序号匹配（支持中文数字"第一个"）
                const num = this.deviceManager.chineseToNumber(text);
                if (num && num >= 1 && num <= commands.length) {
                    selected = commands[num - 1];
                }
                if (!selected) {
                    for (const cmd of commands) {
                        if (cmd.name && text.includes(cmd.name)) {
                            selected = cmd;
                            break;
                        }
                    }
                }
                if (!selected) {
                    // 语义匹配
                    const actionInfo = this.deviceManager._extractAction(text, lower);
                    for (const cmd of commands) {
                        const cmdSem = this.deviceManager._actionSemantics(cmd.action);
                        if (actionInfo.sem && cmdSem === actionInfo.sem) {
                            selected = cmd;
                            break;
                        }
                    }
                }
                if (selected) {
                    // 提取数值（如"调到50"）
                    const numVal = text.match(/(\d+(?:\.\d+)?)/);
                    const customValue = numVal ? Number(numVal[1]) : null;
                    this._executeSmartDevice({
                        device: device,
                        cmd: selected,
                        customValue: customValue
                    });
                } else {
                    this.appendAiChunk('未识别到选择的操作，请重新说出指令');
                    this.finalizeAiMessage();
                    this.finishSpeak();
                }
                return true;
            }

            return false;
        }

        /**
         * 处理语音匹配到的设备控制指令
         * 动态注入的设备命令被命中后，直接执行设备控制并语音播报结果
         */
        async handleDeviceVoiceCommand(devCmd) {
            this.busy = true;
            this.setStatus(`控制${devCmd.deviceName}...`, 'thinking');
            this.particles.setState('thinking');
            // 在对话气泡中显示控制意图（数值类命令附带数值）
            const intent = (devCmd.customValue !== undefined && devCmd.customValue !== null)
                ? `正在控制 ${devCmd.deviceName}：${devCmd.actionName} 设为 ${devCmd.customValue}`
                : `正在控制 ${devCmd.deviceName}：${devCmd.actionName}`;
            this.appendAiChunk(intent);
            this.finalizeAiMessage();

            // 执行设备控制（数值类命令透传 custom_value）
            const ctrlParam = (devCmd.customValue !== undefined && devCmd.customValue !== null)
                ? { custom_value: devCmd.customValue }
                : {};
            const result = await this.deviceManager.executeControl(
                devCmd.deviceId, devCmd.action, null, ctrlParam
            );
            const success = result.success;
            // 语音播报结果
            let speakText;
            if (success) {
                speakText = (devCmd.customValue !== undefined && devCmd.customValue !== null)
                    ? `已将${devCmd.deviceName}的${devCmd.actionName}设为${devCmd.customValue}`
                    : `已${devCmd.actionName}：${devCmd.deviceName}`;
            } else {
                speakText = `${devCmd.deviceName}控制失败：${result.error || '请检查设备是否在线'}`;
            }
            this.appendAiChunk(speakText);
            this.finalizeAiMessage();
            this.history.push({ role: 'user', content: `${devCmd.deviceName} ${devCmd.actionName}` });
            this.history.push({ role: 'assistant', content: speakText });
            if (this.history.length > 10) this.history = this.history.slice(-10);

            this.setStatus('语音输出中...', 'speaking');
            this.particles.setState('speaking');
            if (this.config.tts && speakText) {
                if (this.config.ttsEngine === 'browser') this.simulateSpeakingVolume();
                this.synth.speak(speakText, () => this.finishSpeak());
            } else {
                this.finishSpeak();
            }
        }

        /** 设备控制按钮触发后的结果回调（用于语音播报） */
        onDeviceControlResult(result) {
            // 仅在非语音触发（按钮点击）时播报
            if (this.busy) return;
            const text = result.success
                ? `已${result.action}：${result.device}`
                : `${result.device}控制失败`;
            showToast(text, 2000);
        }

        /**
         * 解析统一内容块格式 <<CONTENT type="..." ...>>...<<END>>
         * 同时兜底支持 Markdown 代码块（```lang\n...\n```）与图片（![alt](url)）
         * 返回 { cleanText, blocks }
         * blocks: [{ type, content, lang, chartType, title, data, path, command, confirm, ... }]
         */
        parseContentBlocks(text) {
            const blocks = [];
            // 用占位符记录已识别的内容片段位置，最后统一剥离
            // 注意：需要保留文本顺序，所以用数组收集 [start, end, replacement]
            const spans = [];

            // 1. 优先匹配统一标记 <<CONTENT attr>>...<<END>>
            // 容错：LLM 实际返回可能存在格式偏差
            //   - 开始标签可能为 > 或 >>（如 <<CONTENT ...> 而非 <<CONTENT ...>>）
            //   - 结束标签可能为 <<END>> / <><END>> / <END>> / <<END> 等变体
            //   - src 属性值可能含反引号、首尾空格（需清理）
            const pattern = /<<CONTENT\s+([^>]*?)><?(?:>)?([\s\S]*?)(?:<<END>>|<><END>>|<END>>|<<END>)/g;
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const attrStr = match[1] || '';
                const content = match[2] || '';
                const attrs = {};
                const attrPattern = /(\w[\w-]*)\s*=\s*"([^"]*)"/g;
                let am;
                while ((am = attrPattern.exec(attrStr)) !== null) {
                    attrs[am[1]] = am[2];
                }
                const type = attrs.type || 'text';
                const block = { type, ...attrs };

                if (type === 'code') {
                    block.lang = attrs.lang || 'code';
                    block.content = content;
                } else if (type === 'chart') {
                    block.chartType = attrs['chart-type'] || 'bar';
                    try {
                        const parsed = JSON.parse(content);
                        block.data = parsed;
                        block.title = parsed.title || '';
                    } catch (e) {
                        block.data = { labels: [], datasets: [] };
                        block.title = '图表数据解析失败';
                    }
                } else if (type === 'file') {
                    block.path = attrs.path || content.trim();
                } else if (type === 'image') {
                    block.name = attrs.name || '';
                    // 清理 src 值：移除首尾的反引号、波浪号、空白（LLM 可能误加 markdown 代码标记）
                    block.src = (attrs.src || '').replace(/^[`~\s]+|[`~\s]+$/g, '').trim();
                    block.mime = attrs.mime || '';
                    block.content = content.trim();
                } else if (type === 'command') {
                    block.command = content.trim();
                    block.confirm = attrs.confirm || 'auto';
                } else if (type === 'device') {
                    block.device = attrs.device || '';
                    block.action = attrs.action || '';
                    block.content = content.trim();
                } else {
                    block.content = content;
                }
                blocks.push(block);
                spans.push([match.index, match.index + match[0].length]);
            }

            // 2. 兜底：Markdown 代码块 ```lang\n...\n```
            //    仅当未被 <<CONTENT>> 包裹时识别
            //    特殊处理：bash/sh/zsh 单行命令转为 command 类型执行
            //    正则兼容：lang 后可有空格、支持 \r\n 和 \n 换行
            const codeFence = /```([\w+-]*)[ \t]*\r?\n([\s\S]*?)```/g;
            while ((match = codeFence.exec(text)) !== null) {
                if (this.inSpans(match.index, spans)) continue;
                const lang = (match[1] || 'code').toLowerCase();
                const code = match[2].replace(/\n$/, '');

                // 当 lang 是 shell 类且内容为单行命令时，转为 command 类型执行
                // 避免将多行脚本误判为命令
                const isShell = ['bash', 'sh', 'shell', 'zsh', 'shellscript'].includes(lang);
                const isSingleLine = code.split('\n').length === 1;
                const isCommand = isShell && isSingleLine && this.looksLikeCommand(code);

                if (isCommand) {
                    blocks.push({ type: 'command', command: code.trim(), confirm: 'auto' });
                } else {
                    blocks.push({ type: 'code', lang, content: code });
                }
                spans.push([match.index, match.index + match[0].length]);
            }

            // 3. 兜底：Markdown 图片 ![alt](url)
            const imgMd = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
            while ((match = imgMd.exec(text)) !== null) {
                if (this.inSpans(match.index, spans)) continue;
                const alt = match[1] || '';
                const url = match[2] || '';
                if (!url) continue;
                blocks.push({ type: 'image', src: url, name: alt, mime: '', content: '' });
                spans.push([match.index, match.index + match[0].length]);
            }

            // 4. 兜底：裸 URL 图片（http(s)://*.png|jpg|jpeg|gif|webp|svg）
            const imgUrl = /(^|[^\(])\b(https?:\/\/[^\s)\]]+\.(?:png|jpe?g|gif|webp|svg)(?:\?[^\s)]*)?)/gi;
            while ((match = imgUrl.exec(text)) !== null) {
                const url = match[2];
                const idx = match.index + (match[1] ? match[1].length : 0);
                if (this.inSpans(idx, spans)) continue;
                // 避免重复（已被 markdown 图片覆盖）
                blocks.push({ type: 'image', src: url, name: '', mime: '', content: '' });
                spans.push([idx, idx + url.length]);
            }

            // 5. 统一从原文中剥离所有内容片段，保留纯文本
            let cleanText = text;
            // 按 start 倒序排序，便于从后往前替换，不影响前面索引
            const sorted = [...spans].sort((a, b) => b[0] - a[0]);
            for (const [start, end] of sorted) {
                cleanText = cleanText.slice(0, start) + cleanText.slice(end);
            }
            cleanText = cleanText.replace(/\n{3,}/g, '\n\n').trim();
            return { cleanText, blocks };
        }

        /** 判断索引位置是否落在已记录的片段范围内 */
        inSpans(idx, spans) {
            for (const [s, e] of spans) {
                if (idx >= s && idx < e) return true;
            }
            return false;
        }

        /** 判断文本是否像一条 shell 命令（用于 markdown 代码块兜底识别） */
        looksLikeCommand(text) {
            if (!text || !text.trim()) return false;
            const trimmed = text.trim();
            // 常见命令前缀（与后端 system_command.py 白名单/确认列表对应）
            const cmdPrefixes = [
                'open ', 'cat ', 'ls ', 'ps ', 'df ', 'du ', 'grep ', 'find ',
                'pwd', 'whoami', 'date', 'uptime', 'echo ', 'head ', 'tail ',
                'which ', 'whereis ', 'file ', 'stat ', 'wc ', 'env',
                'uname', 'sw_vers', 'system_profiler', 'lsof', 'netstat',
                'mkdir ', 'touch ', 'cp ', 'mv ', 'rm ', 'ln ',
                'top', 'ping ', 'nslookup', 'dig ', 'hostname',
                'screencapture ', 'caffeinate', 'pmset ',
                'defaults ', 'mdfind ', 'say ', 'afplay '
            ];
            return cmdPrefixes.some(p => trimmed.startsWith(p) || trimmed.toLowerCase().startsWith(p));
        }

        /**
         * 从纯文本中提取 shell 命令行（local agent 兜底）
         * 仅提取独立的命令行，避免从普通句子中误提取
         * @returns {string[]} 命令字符串数组
         */
        extractCommandsFromText(text) {
            if (!text) return [];
            const commands = [];
            const lines = text.split('\n');

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                // 跳过明显是说明文字的行（含中文标点或句号）
                if (/[。，；！？、]/.test(trimmed)) continue;
                // 跳过过长的行（命令通常较短）
                if (trimmed.length > 200) continue;
                // 必须以已知命令前缀开头
                if (this.looksLikeCommand(trimmed)) {
                    // 去除行尾可能的说明性文字（如 "  # 打开图片"）
                    const cmdPart = trimmed.split(/\s+#\s/)[0].trim();
                    if (cmdPart && this.looksLikeCommand(cmdPart)) {
                        commands.push(cmdPart);
                    }
                }
            }
            return commands;
        }

        /** 格式化指令执行结果为可读文本 */
        formatCommandResults(results) {
            if (!results || results.length === 0) return '';
            const lines = ['--- 执行结果 ---'];
            for (const { command, result } of results) {
                const status = result.success ? '成功' : '失败';
                lines.push(`[${status}] ${command}`);
                if (result.cancelled) {
                    lines.push('  用户取消执行');
                } else if (result.output) {
                    // 截取输出，避免过长
                    const output = result.output.trim();
                    lines.push('  ' + (output.length > 200 ? output.slice(0, 200) + '...' : output));
                }
                if (result.error) {
                    const error = result.error.trim();
                    lines.push('  错误: ' + (error.length > 200 ? error.slice(0, 200) + '...' : error));
                }
            }
            return lines.join('\n');
        }

        /** 语音合成期间模拟音量（无麦克风输入） */
        simulateSpeakingVolume() {
            let t = 0;
            const sim = () => {
                if (!this.busy) return;
                t += 0.1;
                const v = 0.3 + Math.abs(Math.sin(t)) * 0.35 + Math.random() * 0.1;
                this.particles.setVolume(v);
                this.updateVuMeter(v);
                requestAnimationFrame(sim);
            };
            sim();
        }

        /** AI 回复结束后自动开始听取，用户点击按钮可关闭 */
        finishSpeak() {
            this.busy = false;
            this.particles.setVolume(0);
            this.updateVuMeter(0);
            // 自动连续听取
            this.startAutoListen();
        }

        /** 自动开始听取（AI 回复后触发） */
        async startAutoListen() {
            if (!this.recognizer.supported) {
                this.setStatus('点击麦克风开始对话');
                this.particles.setState('idle');
                // 不支持识别时恢复唤醒词检测
                this.startWakeWord();
                return;
            }

            this.autoListening = true;
            this.listenStarting = true;
            this.setStatus('正在聆听...', 'active');
            $('#mic-btn').classList.add('recording');
            $('#mic-hint').textContent = '点击停止';
            $('#vu-meter').classList.add('active');
            this.particles.setState('listening');

            // 等待语音合成资源完全释放（AudioContext/麦克风可能仍被占用）
            await new Promise(r => setTimeout(r, 300));
            if (!this.listenStarting) return;  // 启动已被取消

            // 启动音量分析
            const ok = await this.analyser.start();
            if (!this.listenStarting) return;  // 启动已被取消
            if (!ok) {
                this.listenStarting = false;
                this.autoListening = false;
                this.setStatus('点击麦克风开始对话');
                this.particles.setState('idle');
                $('#mic-btn').classList.remove('recording');
                $('#mic-hint').textContent = '点击开始';
                $('#vu-meter').classList.remove('active');
                // 麦克风失败时恢复唤醒词检测
                this.startWakeWord();
                return;
            }

            // 短暂延迟后启动识别器，确保麦克风资源就绪
            await new Promise(r => setTimeout(r, 200));
            if (!this.listenStarting) return;  // 启动已被取消
            if (!this.autoListening) return;

            this.recognizer.start();
            this.listenStarting = false;
            // 启动15秒无语音超时
            this.startListenTimeout();
        }

        /** 中断所有进行中的流程（思考/说话） */
        stopAll() {
            this.busy = false;
            this.autoListening = false;
            this.listenStarting = false;
            this.clearListenTimeout();
            this.synth.stop();
            this.recognizer.stop();
            this.analyser.stop();
            this.particles.setVolume(0);
            this.updateVuMeter(0);
            // 中断正在进行的语音确认
            if (this.cmdManager) this.cmdManager.resolveConfirm(false);
            $('#mic-btn').classList.remove('recording');
            $('#mic-hint').textContent = '点击开始';
            $('#vu-meter').classList.remove('active');
            this.setStatus('点击麦克风开始对话');
            this.particles.setState('idle');
            // 中断后恢复唤醒词检测
            this.startWakeWord();
        }

        /* ---------- 对话框辅助 ---------- */
        /** 创建一条消息节点 */
        createMessage(role) {
            const msg = document.createElement('div');
            msg.className = 'chat-msg ' + (role === 'user' ? 'user-msg' : 'ai-msg');
            const label = document.createElement('div');
            label.className = 'msg-label';
            label.textContent = role === 'user' ? '你' : 'Seven';
            const bubble = document.createElement('div');
            bubble.className = 'msg-bubble';
            msg.appendChild(label);
            msg.appendChild(bubble);
            return msg;
        }

        /** 滚动到最新消息 */
        scrollChat() {
            const messages = $('#chat-messages');
            messages.scrollTop = messages.scrollHeight;
        }

        /** 追加/更新用户实时识别文本 */
        appendUserInterim(text) {
            const messages = $('#chat-messages');
            let last = messages.lastElementChild;
            if (!last || !last.classList.contains('user-msg') || last.dataset.final === '1') {
                last = this.createMessage('user');
                messages.appendChild(last);
            }
            last.querySelector('.msg-bubble').textContent = text;
            this.scrollChat();
        }

        /** 定稿用户消息 */
        appendUserFinal(text) {
            const messages = $('#chat-messages');
            let last = messages.lastElementChild;
            if (last && last.classList.contains('user-msg') && last.dataset.final !== '1') {
                last.querySelector('.msg-bubble').textContent = text;
                last.dataset.final = '1';
            } else {
                const msg = this.createMessage('user');
                msg.querySelector('.msg-bubble').textContent = text;
                msg.dataset.final = '1';
                messages.appendChild(msg);
            }
            this.scrollChat();
        }

        /** 追加/更新 AI 流式回复文本 */
        appendAiChunk(text) {
            const messages = $('#chat-messages');
            let last = messages.lastElementChild;
            if (!last || !last.classList.contains('ai-msg') || last.dataset.final === '1') {
                last = this.createMessage('ai');
                messages.appendChild(last);
            }
            last.querySelector('.msg-bubble').textContent = text;
            this.scrollChat();
        }

        /** 定稿 AI 消息（移除光标） */
        finalizeAiMessage() {
            const messages = $('#chat-messages');
            const last = messages.lastElementChild;
            if (last && last.classList.contains('ai-msg')) {
                last.classList.add('final');
                last.dataset.final = '1';
            }
        }

        /** 清空对话记录 */
        clearChat() {
            $('#chat-messages').innerHTML = '';
        }

        /* ---------- 辅助 ---------- */
        setStatus(text, cls = '') {
            const el = $('#status-text');
            el.textContent = text;
            el.className = 'status-text' + (cls ? ' ' + cls : '');
        }

        updateVuMeter(v) {
            const bars = document.querySelectorAll('.vu-bar');
            const level = Math.floor(v * bars.length * 1.4);
            bars.forEach((bar, i) => {
                const active = i < level;
                bar.style.height = active ? (6 + i * 1.5) + 'px' : '6px';
                bar.style.opacity = active ? '0.9' : '0.3';
            });
        }
    }

    /* ============================================================
     * 9. 启动
     * ============================================================ */
    window.addEventListener('DOMContentLoaded', () => {
        window.hiSeven = new App();
        console.log('%cHi_Seven 已启动', 'color:#a855f7;font-size:14px;font-weight:bold;');
    });

})();
