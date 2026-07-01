'use strict';

WM.endings.base = {
    config: null,
    player: null,
    phase: 'auto_move',
    steamParticles: [],
    path: [],
    pathIdx: 0,
    popupBtn: null,
    popupHover: false,
    animTimer: 0,
    popupTitle: '☕ 吧台点单',
    holdTex: null,

    init(stageConfig) {
        this.config = stageConfig;
        this.player = {
            x: 240, y: 224,
            w: 12, h: 8, dir: 0, frame: 0,
            moving: false, animTimer: 0, speed: 0.9, holding: false,
        };
        this.phase = 'auto_move';
        this.steamParticles = [];
        this.path = (stageConfig.ending && stageConfig.ending.path) ? stageConfig.ending.path : [];
        this.pathIdx = 0;
        this.popupBtn = { x: WM.VIEW_W / 2 - 70, y: WM.VIEW_H / 2 + 18, w: 140, h: 22 };
        this.popupHover = false;
        this.animTimer = 0;
    },

    update(dt) {
        if (this.phase === 'auto_move') {
            this.updateAutoMove(dt);
        } else if (this.phase === 'task_anim') {
            this.playTaskAnim(dt);
        }
        this.updateSteam(dt);
    },

    updateAutoMove(dt) {
        const p = this.player;
        if (this.pathIdx >= this.path.length) {
            this.phase = 'popup';
            p.moving = false;
            p.dir = 1;
            p.frame = 0;
            WM.setProgress('到达吧台 — 请确认点单');
            return;
        }
        const target = this.path[this.pathIdx];
        const dx = target.x - p.x;
        const dy = target.y - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < p.speed) {
            p.x = target.x; p.y = target.y;
            this.pathIdx++;
        } else {
            p.moving = true;
            if (Math.abs(dx) > Math.abs(dy)) {
                p.dir = dx > 0 ? 3 : 2;
            } else {
                p.dir = dy > 0 ? 0 : 1;
            }
            p.x += (dx / dist) * p.speed;
            p.y += (dy / dist) * p.speed;
            p.animTimer += dt;
            if (p.animTimer > 140) { p.frame = p.frame ? 0 : 1; p.animTimer = 0; }
        }
    },

    confirmTask() {
        if (this.phase !== 'popup') return;
        this.phase = 'task_anim';
        this.animTimer = 0;
        this.playTaskAnim(0);
    },

    playTaskAnim(dt) {
        this.animTimer += dt;
        if (this.animTimer >= 2000) {
            this.onAnimDone();
        }
    },

    onAnimDone() {
        this.phase = 'done';
        WM.flow.onEndingComplete();
    },

    handleInput(action, data) {
        if (this.phase !== 'popup') return;
        if (action === 'space') {
            this.confirmTask();
        } else if (action === 'click' && data) {
            const b = this.popupBtn;
            if (data.x >= b.x && data.x <= b.x + b.w && data.y >= b.y && data.y <= b.y + b.h) {
                this.confirmTask();
            }
        }
    },

    handleMouseMove(mx, my) {
        if (this.phase !== 'popup') { this.popupHover = false; return; }
        const b = this.popupBtn;
        this.popupHover = (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h);
    },

    draw(ctx) {
        this.drawBackground(ctx);
        this.drawDecorations(ctx);
        if (this.phase !== 'task_anim' && this.phase !== 'done') this.drawTaskPoint(ctx);
        this.drawPlayer(ctx);
        this.drawSteam(ctx);
        this.drawLighting(ctx);
        if (this.phase === 'popup') this.drawPopup(ctx);
    },

    drawBackground(ctx) {},

    drawDecorations(ctx) {},

    drawTaskPoint(ctx) {},

    drawPlayer(ctx) {
        const p = this.player;
        let tex;
        if (p.holding) {
            tex = this.holdTex || WM.tex.playerHold;
        } else {
            tex = WM.tex.player[p.dir][p.frame];
        }
        ctx.drawImage(tex, Math.round(p.x - 8), Math.round(p.y - 16));
    },

    drawPopup(ctx) {
        const W = WM.VIEW_W, H = WM.VIEW_H, PAL = WM.PAL;
        const task = (this.config && this.config.task) ? this.config.task : {};
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, W, H);
        const bx = W / 2 - 100, by = H / 2 - 45, bw = 200, bh = 90;
        ctx.fillStyle = PAL.black;
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = PAL.lamp;
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = PAL.lamp;
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(this.popupTitle || '☕ 吧台点单', W / 2, by + 18);
        ctx.fillStyle = PAL.white;
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText(task.title || '', W / 2, by + 36);
        ctx.fillStyle = '#aaa';
        ctx.font = '7px "Press Start 2P", monospace';
        const cost = task.cost != null ? task.cost : '¥0';
        const duration = task.duration != null ? task.duration : '';
        const hp = task.hp != null ? task.hp : 0;
        ctx.fillText(cost + ' · ' + duration + ' · HP -' + hp, W / 2, by + 50);
        const btn = this.popupBtn;
        ctx.fillStyle = this.popupHover ? PAL.shirtLt : PAL.shirt;
        ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
        ctx.strokeStyle = PAL.white;
        ctx.lineWidth = 2;
        ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
        ctx.fillStyle = PAL.white;
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓ 确认 (Space)', btn.x + btn.w / 2, btn.y + btn.h / 2);
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';
    },

    drawLighting(ctx) {
        const W = WM.VIEW_W, H = WM.VIEW_H;
        ctx.fillStyle = 'rgba(255,170,68,0.06)';
        ctx.fillRect(0, 0, W, H);
        const decos = this.decorations || [];
        const lamps = decos.filter(function (d) { return d.type === 'lamp'; });
        for (let i = 0; i < lamps.length; i++) {
            const l = lamps[i];
            const cx = l.x + 8, cy = l.y + 14;
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40);
            grad.addColorStop(0, 'rgba(255,238,136,0.25)');
            grad.addColorStop(1, 'rgba(255,238,136,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(cx - 40, cy - 40, 80, 80);
        }
    },

    updateSteam(dt) {
        for (let i = 0; i < this.steamParticles.length; i++) {
            const p = this.steamParticles[i];
            if (p.delay > 0) { p.delay -= dt; continue; }
            p.x += p.vx; p.y += p.vy;
            p.life -= dt / 1500;
        }
        this.steamParticles = this.steamParticles.filter(function (p) { return p.life > 0; });
    },

    drawSteam(ctx) {
        for (let i = 0; i < this.steamParticles.length; i++) {
            const p = this.steamParticles[i];
            if (p.delay > 0) continue;
            ctx.fillStyle = 'rgba(255,255,255,' + (p.life * 0.6) + ')';
            ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
            ctx.fillRect(Math.round(p.x + 2), Math.round(p.y - 2), 1, 1);
        }
    },
};
