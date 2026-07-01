'use strict';

WM.endings.coffee = Object.create(WM.endings.base);

WM.endings.coffee.init = function (stageConfig) {
    WM.endings.base.init.call(this, stageConfig);
    this.popupTitle = '☕ 吧台点单';
    this.holdTex = WM.tex.playerHold;
    const tx = WM.tx, ty = WM.ty;
    this.decorations = [
        { type: 'lamp', x: tx(4), y: ty(0) }, { type: 'lamp', x: tx(10), y: ty(0) },
        { type: 'lamp', x: tx(16), y: ty(0) }, { type: 'lamp', x: tx(22), y: ty(0) },
        { type: 'lamp', x: tx(27), y: ty(0) },
        { type: 'menu', x: tx(1), y: ty(2) },
        { type: 'window', x: tx(26), y: ty(2) },
        { type: 'bar', x: tx(2), y: ty(8) }, { type: 'bar', x: tx(4), y: ty(8) },
        { type: 'machine', x: tx(3), y: ty(6) },
        { type: 'plant', x: tx(7), y: ty(7) }, { type: 'plant', x: tx(28), y: ty(7) },
        { type: 'table', x: tx(10), y: ty(10) }, { type: 'chair', x: tx(9), y: ty(11) }, { type: 'chair', x: tx(13), y: ty(11) },
        { type: 'table', x: tx(16), y: ty(10) }, { type: 'chair', x: tx(15), y: ty(11) }, { type: 'chair', x: tx(19), y: ty(11) },
        { type: 'table', x: tx(22), y: ty(10) }, { type: 'chair', x: tx(21), y: ty(11) }, { type: 'chair', x: tx(25), y: ty(11) },
    ];
    this.taskPoint = { x: tx(4) + 16, y: ty(10) };
    this.machinePos = { x: tx(3) + 16, y: ty(6) + 8 };
};

WM.endings.coffee.drawBackground = function (ctx) {
    const tx = WM.tx, ty = WM.ty, tex = WM.tex;
    ctx.fillStyle = '#1a0f0a';
    ctx.fillRect(0, 0, WM.VIEW_W, WM.VIEW_H);
    for (let y = 0; y < 6; y++)
        for (let x = 0; x < 30; x++) ctx.drawImage(tex.wall, tx(x), ty(y));
    for (let y = 6; y < 8; y++)
        for (let x = 0; x < 30; x++) ctx.drawImage(tex.wallFloor, tx(x), ty(y));
    for (let y = 8; y < 16; y++)
        for (let x = 0; x < 30; x++)
            ctx.drawImage((x + y) % 2 === 0 ? tex.floorA : tex.floorB, tx(x), ty(y));
};

WM.endings.coffee.drawDecorations = function (ctx) {
    const decos = this.decorations.slice().sort(function (a, b) { return a.y - b.y; });
    for (let i = 0; i < decos.length; i++) {
        const d = decos[i];
        const t = WM.tex[d.type];
        if (t) ctx.drawImage(t, d.x, d.y);
    }
};

WM.endings.coffee.drawTaskPoint = function (ctx) {
    const bob = Math.sin(Date.now() / 300) * 3;
    ctx.drawImage(WM.tex.star, this.taskPoint.x - 8, this.taskPoint.y - 22 + bob);
};

WM.endings.coffee.playTaskAnim = function (dt) {
    this.animTimer += dt;
    if (this.animTimer < 2500 && this.steamParticles.length < 6) {
        this.steamParticles.push({
            x: this.machinePos.x + (Math.random() - 0.5) * 8,
            y: this.machinePos.y,
            vy: -0.4 - Math.random() * 0.3,
            vx: (Math.random() - 0.5) * 0.2,
            life: 1.0, delay: this.steamParticles.length * 200,
        });
    }
    if (this.animTimer >= 2500) {
        this.player.holding = true;
    }
    if (this.animTimer >= 3300) {
        this.onAnimDone();
    }
};
