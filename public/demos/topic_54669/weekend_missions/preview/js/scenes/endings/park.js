'use strict';

WM.endings.park = Object.create(WM.endings.base);

WM.endings.park._lerp = function (a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ar = (pa >> 16) & 255, ag = (pa >> 8) & 255, ab = pa & 255;
    const br = (pb >> 16) & 255, bg = (pb >> 8) & 255, bb = pb & 255;
    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg - ag) * t);
    const bl = Math.round(ab + (bb - ab) * t);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
};

WM.endings.park.init = function (stageConfig) {
    WM.endings.base.init.call(this, stageConfig);
    this.popupTitle = '🌅 海边长椅';
    this.countdown = (stageConfig.ending && stageConfig.ending.countdown) || 10;
    this.countdownTimer = 0;
    this.sunsetProgress = 0;
    this.seated = false;
    this.taskPoint = (stageConfig.ending && stageConfig.ending.taskPoint) || { x: 80, y: 176 };
    this.decorations = [
        { type: 'beachTree', x: 8, y: 128 },
        { type: 'beachTree', x: 456, y: 128 },
        { type: 'streetLamp', x: 200, y: 128 },
        { type: 'streetLamp', x: 336, y: 128 },
        { type: 'benchPark', x: this.taskPoint.x - 16, y: this.taskPoint.y - 8 },
    ];
};

WM.endings.park.drawBackground = function (ctx) {
    const W = WM.VIEW_W, H = WM.VIEW_H, PAL = WM.PAL;
    const sp = this.sunsetProgress;
    const horizonY = 96, seaBottom = 160;

    const topC = this._lerp(PAL.seasideSky1, '#2a1a4a', sp);
    const botC = this._lerp(PAL.seasideSky2, '#5a2a5a', sp);
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, topC);
    skyGrad.addColorStop(1, botC);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, horizonY);

    const sunX = 352;
    const sunY = 28 + sp * 58;
    const sunC = this._lerp('#ffe9b0', '#ff4a22', sp);
    ctx.fillStyle = sunC;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = this._lerp('#5a6a8a', '#1a1530', sp);
    const hills = [
        { x: -20, w: 180, h: 26 },
        { x: 140, w: 220, h: 34 },
        { x: 320, w: 200, h: 22 },
    ];
    for (let i = 0; i < hills.length; i++) {
        const m = hills[i];
        ctx.beginPath();
        ctx.moveTo(m.x, horizonY);
        ctx.quadraticCurveTo(m.x + m.w / 2, horizonY - m.h, m.x + m.w, horizonY);
        ctx.closePath();
        ctx.fill();
    }

    const seaC = this._lerp('#4a7c9a', '#1a2438', sp);
    ctx.fillStyle = seaC;
    ctx.fillRect(0, horizonY, W, seaBottom - horizonY);

    const sunReflect = this._lerp('#ffd98a', '#aa3a3a', sp);
    ctx.fillStyle = sunReflect;
    ctx.globalAlpha = 0.4;
    ctx.fillRect(sunX - 8, horizonY, 16, seaBottom - horizonY);
    ctx.globalAlpha = 1;

    const scroll = Date.now() / 600;
    const waveC = this._lerp('#7ab0d0', '#2a3a52', sp);
    ctx.fillStyle = waveC;
    for (let wy = horizonY + 8; wy < seaBottom; wy += 12) {
        for (let wx = 0; wx < W; wx += 8) {
            const off = Math.sin((wx / 28) + scroll + wy) * 2;
            ctx.fillRect(wx, Math.round(wy + off), 4, 1);
        }
    }

    const groundC = this._lerp('#8B7355', '#3a2d22', sp * 0.7);
    ctx.fillStyle = groundC;
    ctx.fillRect(0, seaBottom, W, H - seaBottom);
    const plankC = this._lerp('#6B5333', '#2a2018', sp * 0.7);
    ctx.fillStyle = plankC;
    for (let py = seaBottom + 10; py < H; py += 14) {
        ctx.fillRect(0, py, W, 2);
    }
    const seamC = this._lerp('#5a4528', '#241b12', sp * 0.7);
    ctx.fillStyle = seamC;
    for (let px = 0; px < W; px += 48) {
        ctx.fillRect(px, seaBottom, 2, H - seaBottom);
    }
};

WM.endings.park.drawDecorations = function (ctx) {
    const decos = this.decorations.slice().sort(function (a, b) { return a.y - b.y; });
    for (let i = 0; i < decos.length; i++) {
        const d = decos[i];
        const t = WM.tex[d.type];
        if (t) ctx.drawImage(t, d.x, d.y);
    }
};

WM.endings.park.drawTaskPoint = function (ctx) {
    const bob = Math.sin(Date.now() / 300) * 3;
    ctx.drawImage(WM.tex.star, this.taskPoint.x - 8, this.taskPoint.y - 30 + bob);
};

WM.endings.park.confirmTask = function () {
    if (this.phase !== 'popup') return;
    this.phase = 'task_anim';
    this.animTimer = 0;
    this.seated = true;
    this.player.moving = false;
};

WM.endings.park.playTaskAnim = function (dt) {
    this.countdownTimer += dt;
    while (this.countdownTimer >= 1000) {
        this.countdown--;
        this.countdownTimer -= 1000;
    }
    let sp = (10 - this.countdown) / 10;
    if (sp < 0) sp = 0;
    if (sp > 1) sp = 1;
    this.sunsetProgress = sp;
    if (this.countdown <= 0) {
        this.onAnimDone();
    }
};

WM.endings.park.drawPlayer = function (ctx) {
    if (this.seated) {
        const p = this.player;
        ctx.drawImage(WM.tex.playerSit, Math.round(p.x - 8), Math.round(p.y - 16));
    } else {
        WM.endings.base.drawPlayer.call(this, ctx);
    }
};

WM.endings.park.draw = function (ctx) {
    WM.endings.base.draw.call(this, ctx);
    if (this.phase !== 'task_anim') return;

    const W = WM.VIEW_W, H = WM.VIEW_H;
    const c = Math.max(0, this.countdown);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe066';
    ctx.font = 'bold 24px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillText(c + '', W / 2, 42);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillText('享受日落...', W / 2, 62);

    const cells = 10;
    const cw = 22, ch = 8, gap = 3;
    const totalW = cells * cw + (cells - 1) * gap;
    const startX = (W - totalW) / 2;
    const barY = H - 26;
    for (let i = 0; i < cells; i++) {
        const cx = startX + i * (cw + gap);
        if (i < c) {
            ctx.fillStyle = '#ffcc33';
        } else {
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
        }
        ctx.fillRect(cx, barY, cw, ch);
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx + 0.5, barY + 0.5, cw - 1, ch - 1);
    }
    ctx.textAlign = 'left';
};
