'use strict';

WM.endings.mountain = Object.create(WM.endings.park);

WM.endings.mountain.init = function (stageConfig) {
    WM.endings.park.init.call(this, stageConfig);
    this.popupTitle = '🌄 山顶观景';
    this.decorations = [
        { type: 'streetLamp', x: 200, y: 128 },
        { type: 'benchPark', x: this.taskPoint.x - 16, y: this.taskPoint.y - 8 },
    ];
};

WM.endings.mountain.drawBackground = function (ctx) {
    const W = WM.VIEW_W, H = WM.VIEW_H;
    const sp = this.sunsetProgress;
    const horizonY = 108, lakeBottom = 158;

    const topC = this._lerp('#ffb36b', '#2a1a4a', sp);
    const botC = this._lerp('#ffd18a', '#6a3a58', sp);
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, topC);
    skyGrad.addColorStop(1, botC);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, horizonY);

    const sunX = 350;
    const sunY = 34 + sp * 50;
    const sunC = this._lerp('#ffe9b0', '#ff6a3a', sp);
    ctx.fillStyle = sunC;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = this._lerp('#5d7f70', '#202b28', sp);
    const hills = [
        { x: -40, w: 170, h: 34 },
        { x: 90, w: 210, h: 46 },
        { x: 260, w: 260, h: 40 },
    ];
    for (let i = 0; i < hills.length; i++) {
        const m = hills[i];
        ctx.beginPath();
        ctx.moveTo(m.x, horizonY);
        ctx.quadraticCurveTo(m.x + m.w / 2, horizonY - m.h, m.x + m.w, horizonY);
        ctx.closePath();
        ctx.fill();
    }

    const lakeC = this._lerp('#6aa6bd', '#263e55', sp);
    ctx.fillStyle = lakeC;
    ctx.fillRect(0, horizonY, W, lakeBottom - horizonY);
    ctx.fillStyle = this._lerp('#ffd98a', '#bb5a45', sp);
    ctx.globalAlpha = 0.34;
    ctx.fillRect(sunX - 7, horizonY, 14, lakeBottom - horizonY);
    ctx.globalAlpha = 1;

    const shimmer = this._lerp('#f7d58c', '#6b5a66', sp);
    ctx.fillStyle = shimmer;
    for (let y = horizonY + 9; y < lakeBottom; y += 11) {
        for (let x = 0; x < W; x += 42) {
            const off = Math.sin(Date.now() / 600 + y + x / 20) * 4;
            ctx.fillRect(Math.round(x + off), y, 18, 1);
        }
    }

    ctx.fillStyle = this._lerp('#4a6b3d', '#25311f', sp * 0.8);
    ctx.beginPath();
    ctx.moveTo(0, lakeBottom + 28);
    ctx.quadraticCurveTo(110, lakeBottom - 6, 230, lakeBottom + 18);
    ctx.quadraticCurveTo(350, lakeBottom + 44, W, lakeBottom + 8);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = this._lerp('#6B5333', '#2f271b', sp * 0.7);
    ctx.fillRect(0, lakeBottom + 52, W, H - lakeBottom - 52);
    WM.drawEndingVariant(this, 'back', ctx);
};

WM.endings.mountain.draw = function (ctx) {
    WM.endings.park.draw.call(this, ctx);
    if (this.phase !== 'task_anim') return;
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('等一场西湖日落...', WM.VIEW_W / 2, 62);
    ctx.textAlign = 'left';
};
