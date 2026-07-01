'use strict';

WM.endings.bund = Object.create(WM.endings.base);

WM.endings.bund.init = function (stageConfig) {
    WM.endings.base.init.call(this, stageConfig);
    this.popupTitle = '📸 外滩合照点';
    this.holdTex = WM.tex.playerHoldCamera;
    this.taskPoint = (stageConfig.ending && stageConfig.ending.taskPoint) || { x: 80, y: 176 };
    this.flashAlpha = 0;
    this.showPhoto = false;
    this.decorations = [
        { type: 'streetLamp', x: 128, y: 128 },
        { type: 'streetLamp', x: 336, y: 128 },
    ];
};

WM.endings.bund.drawBackground = function (ctx) {
    const W = WM.VIEW_W, H = WM.VIEW_H;
    const sky = ctx.createLinearGradient(0, 0, 0, 110);
    sky.addColorStop(0, '#071225');
    sky.addColorStop(1, '#1a2a4a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#f1c40f';
    for (let i = 0; i < 26; i++) {
        const x = (i * 73) % W;
        const y = 12 + (i * 31) % 78;
        ctx.fillRect(x, y, 1, 1);
    }

    ctx.fillStyle = '#111827';
    const buildings = [
        { x: 232, w: 24, h: 58 },
        { x: 266, w: 28, h: 82 },
        { x: 306, w: 24, h: 62 },
        { x: 344, w: 30, h: 88 },
        { x: 386, w: 26, h: 54 },
        { x: 428, w: 28, h: 70 },
    ];
    for (let i = 0; i < buildings.length; i++) {
        const b = buildings[i];
        ctx.fillRect(b.x, 126 - b.h, b.w, b.h);
        ctx.fillStyle = '#f1c40f';
        for (let y = 126 - b.h + 10; y < 120; y += 14) {
            ctx.fillRect(b.x + 6, y, 3, 3);
            ctx.fillRect(b.x + b.w - 10, y + 5, 3, 3);
        }
        ctx.fillStyle = '#111827';
    }
    ctx.fillRect(326, 34, 6, 92);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(318, 54, 22, 10);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(315, 82, 28, 12);

    ctx.fillStyle = '#263e55';
    ctx.fillRect(0, 126, W, 58);
    ctx.fillStyle = 'rgba(241,196,15,0.35)';
    for (let y = 136; y < 178; y += 12) {
        for (let x = 220; x < W; x += 42) ctx.fillRect(x, y, 24, 1);
    }

    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 184, W, H - 184);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(0, 172, W, 4);
    for (let x = 0; x < W; x += 28) ctx.fillRect(x, 162, 3, 24);
    WM.drawEndingVariant(this, 'back', ctx);
};

WM.endings.bund.drawDecorations = function (ctx) {
    const decos = this.decorations.slice().sort(function (a, b) { return a.y - b.y; });
    for (let i = 0; i < decos.length; i++) {
        const d = decos[i];
        const t = WM.tex[d.type];
        if (t) ctx.drawImage(t, d.x, d.y);
    }
    WM.drawEndingVariant(this, 'front', ctx);
};

WM.endings.bund.drawTaskPoint = function (ctx) {
    const bob = Math.sin(Date.now() / 300) * 3;
    ctx.drawImage(WM.tex.star, this.taskPoint.x - 8, this.taskPoint.y - 24 + bob);
};

WM.endings.bund.playTaskAnim = function (dt) {
    this.animTimer += dt;
    const t = this.animTimer;
    if (t > 500 && t < 850) {
        this.flashAlpha = Math.sin(((t - 500) / 350) * Math.PI);
    } else {
        this.flashAlpha = 0;
    }
    if (t >= 850) this.showPhoto = true;
    if (t >= 1600) this.player.holding = true;
    if (t >= 2600) this.onAnimDone();
};

WM.endings.bund.draw = function (ctx) {
    WM.endings.base.draw.call(this, ctx);
    if (this.flashAlpha > 0) {
        ctx.fillStyle = 'rgba(255,255,255,' + this.flashAlpha + ')';
        ctx.fillRect(0, 0, WM.VIEW_W, WM.VIEW_H);
    }
    if (this.showPhoto && this.phase === 'task_anim') this.drawPhotoFrame(ctx);
};

WM.endings.bund.drawPhotoFrame = function (ctx) {
    const W = WM.VIEW_W, H = WM.VIEW_H;
    const fw = 142, fh = 88;
    const fx = Math.round(W / 2 - fw / 2);
    const fy = Math.round(H / 2 - fh / 2);
    ctx.fillStyle = 'rgba(0,0,0,0.48)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(fx - 5, fy - 5, fw + 10, fh + 20);
    ctx.fillStyle = '#101827';
    ctx.fillRect(fx, fy, fw, fh);
    ctx.fillStyle = '#f1c40f';
    ctx.font = '10px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('外滩通关合照', W / 2, fy + fh + 13);
    ctx.textAlign = 'left';
};
