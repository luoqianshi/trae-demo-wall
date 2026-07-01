'use strict';

WM.endings.mall = Object.create(WM.endings.base);

WM.endings.mall.init = function (stageConfig) {
    WM.endings.base.init.call(this, stageConfig);
    this.popupTitle = '📷 最佳拍照点';
    this.holdTex = WM.tex.playerHoldCamera;
    this.railY = 112;
    const rail = [];
    for (let x = 0; x < WM.VIEW_W; x += 32) {
        rail.push({ type: 'glassRail', x: x, y: this.railY });
    }
    this.decorations = rail.concat([
        { type: 'bench', x: 272, y: 196 },
        { type: 'bench', x: 376, y: 150 },
        { type: 'vendingMachine', x: 432, y: 144 },
        { type: 'plant', x: 156, y: 200 },
    ]);
    this.taskPoint = { x: 80, y: 150 };
    this.cameraZoom = 1;
    this.flashAlpha = 0;
    this.showPhoto = false;
};

WM.endings.mall.drawBackground = function (ctx) {
    const W = WM.VIEW_W, H = WM.VIEW_H, PAL = WM.PAL, tex = WM.tex;
    const floorTop = this.railY + 16;
    const sky = ctx.createLinearGradient(0, 0, 0, floorTop);
    sky.addColorStop(0, PAL.commercialSky1);
    sky.addColorStop(1, PAL.commercialSky2);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, floorTop);

    const skyline = [
        { i: 0, x: 10 }, { i: 1, x: 70 }, { i: 2, x: 132 },
        { i: 0, x: 196 }, { i: 1, x: 258 }, { i: 2, x: 322 },
        { i: 0, x: 386 }, { i: 1, x: 446 },
    ];
    const bw = 32 * 0.62, bh = 48 * 0.62;
    const baseY = floorTop - 2;
    for (let k = 0; k < skyline.length; k++) {
        const b = skyline[k];
        const h = bh * (0.7 + (k % 3) * 0.15);
        ctx.globalAlpha = 0.55;
        ctx.drawImage(tex.building[b.i], b.x, baseY - h, bw, h);
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(24,12,36,0.45)';
        ctx.fillRect(b.x, baseY - h, bw, h);
    }

    for (let y = floorTop; y < H; y += 16) {
        for (let x = 0; x < W; x += 16) {
            const t = ((x / 16) + (y / 16)) % 2 === 0 ? tex.floorA : tex.floorB;
            ctx.drawImage(t, x, y);
        }
    }
    ctx.fillStyle = 'rgba(120,140,180,0.18)';
    ctx.fillRect(0, floorTop, W, H - floorTop);
    ctx.fillStyle = 'rgba(40,50,70,0.22)';
    ctx.fillRect(0, floorTop, W, H - floorTop);
    WM.drawEndingVariant(this, 'back', ctx);
};

WM.endings.mall.drawDecorations = function (ctx) {
    const decos = this.decorations.slice().sort(function (a, b) { return a.y - b.y; });
    for (let i = 0; i < decos.length; i++) {
        const d = decos[i];
        const t = WM.tex[d.type];
        if (t) ctx.drawImage(t, d.x, d.y);
    }
    WM.drawEndingVariant(this, 'front', ctx);
};

WM.endings.mall.drawTaskPoint = function (ctx) {
    const bob = Math.sin(Date.now() / 300) * 3;
    ctx.drawImage(WM.tex.star, this.taskPoint.x - 8, this.taskPoint.y - 22 + bob);
};

WM.endings.mall.playTaskAnim = function (dt) {
    this.animTimer += dt;
    const t = this.animTimer;
    if (t <= 1000) {
        this.cameraZoom = 1 + 0.3 * (t / 1000);
    } else {
        this.cameraZoom = 1.3;
    }
    if (t > 1000 && t < 1200) {
        this.flashAlpha = Math.sin(((t - 1000) / 200) * Math.PI);
    } else {
        this.flashAlpha = 0;
    }
    if (t >= 1200) this.showPhoto = true;
    if (t >= 2500) this.player.holding = true;
    if (t >= 3300) this.onAnimDone();
};

WM.endings.mall.draw = function (ctx) {
    if (this.phase !== 'task_anim') {
        WM.endings.base.draw.call(this, ctx);
        return;
    }
    const p = this.player;
    const z = this.cameraZoom;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(z, z);
    ctx.translate(-p.x, -p.y);
    this.drawBackground(ctx);
    this.drawDecorations(ctx);
    this.drawPlayer(ctx);
    this.drawLighting(ctx);
    ctx.restore();

    if (this.flashAlpha > 0) {
        ctx.fillStyle = 'rgba(255,255,255,' + this.flashAlpha + ')';
        ctx.fillRect(0, 0, WM.VIEW_W, WM.VIEW_H);
    }
    if (this.showPhoto) this.drawPhotoFrame(ctx);
};

WM.endings.mall.drawPhotoFrame = function (ctx) {
    const W = WM.VIEW_W, H = WM.VIEW_H, PAL = WM.PAL;
    const fw = 116, fh = 134;
    const fx = Math.round(W / 2 - fw / 2);
    const fy = Math.round(H / 2 - fh / 2);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = PAL.black;
    ctx.fillRect(fx - 6, fy - 6, fw + 12, fh + 12);
    ctx.fillStyle = PAL.white;
    ctx.fillRect(fx - 3, fy - 3, fw + 6, fh + 6);
    const sky = ctx.createLinearGradient(0, fy, 0, fy + fh - 26);
    sky.addColorStop(0, PAL.commercialSky1);
    sky.addColorStop(1, PAL.commercialSky2);
    ctx.fillStyle = sky;
    ctx.fillRect(fx, fy, fw, fh - 26);
    ctx.fillStyle = 'rgba(24,12,36,0.6)';
    for (let k = 0; k < 5; k++) {
        const h = 18 + (k % 3) * 10;
        ctx.fillRect(fx + 6 + k * 22, fy + (fh - 26) - h, 16, h);
    }
    const cx = fx + fw / 2;
    const fy2 = fy + fh - 26;
    ctx.fillStyle = 'rgba(20,20,40,0.9)';
    ctx.fillRect(cx - 6, fy2 - 36, 12, 12);
    ctx.fillRect(cx - 9, fy2 - 24, 18, 24);
    ctx.fillStyle = PAL.white;
    ctx.fillRect(fx, fy2, fw, 26);
    ctx.fillStyle = PAL.black;
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TOP FLOOR', cx, fy2 + 17);
    ctx.textAlign = 'left';
};
