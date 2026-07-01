'use strict';

WM.endings.bookstore = Object.create(WM.endings.base);

WM.endings.bookstore.init = function (stageConfig) {
    WM.endings.base.init.call(this, stageConfig);
    this.popupTitle = '📚 书架前';
    this.holdTex = WM.tex.playerHoldBook;
    const tx = WM.tx, ty = WM.ty;
    this.decorations = [
        { type: 'lamp', x: tx(8), y: ty(0) }, { type: 'lamp', x: tx(20), y: ty(0) },
        { type: 'bookshelf', x: 16, y: ty(1) },
        { type: 'bookshelf', x: 104, y: ty(1) },
        { type: 'bookshelf', x: 192, y: ty(1) },
        { type: 'bookshelf', x: 280, y: ty(1) },
        { type: 'bookshelf', x: 368, y: ty(1) },
        { type: 'plant', x: tx(1), y: ty(8) }, { type: 'plant', x: tx(28), y: ty(8) },
        { type: 'readTable', x: tx(8), y: ty(10) }, { type: 'chair', x: tx(8), y: ty(11) }, { type: 'chair', x: tx(12), y: ty(11) },
        { type: 'readTable', x: tx(18), y: ty(10) }, { type: 'chair', x: tx(18), y: ty(11) }, { type: 'chair', x: tx(22), y: ty(11) },
    ];
    this.targetShelf = { x: 192, y: ty(1) };
    this.taskPoint = { x: this.targetShelf.x + 16, y: this.targetShelf.y + 64 };
    this.shakeShelf = null;
    this.bookFly = [];
};

WM.endings.bookstore.drawBackground = function (ctx) {
    const tx = WM.tx, ty = WM.ty, tex = WM.tex;
    ctx.fillStyle = '#0d1410';
    ctx.fillRect(0, 0, WM.VIEW_W, WM.VIEW_H);
    for (let y = 0; y < 6; y++)
        for (let x = 0; x < 30; x++) ctx.drawImage(tex.wall, tx(x), ty(y));
    for (let y = 6; y < 8; y++)
        for (let x = 0; x < 30; x++) ctx.drawImage(tex.wallFloor, tx(x), ty(y));
    for (let y = 8; y < 16; y++)
        for (let x = 0; x < 30; x++)
            ctx.drawImage((x + y) % 2 === 0 ? tex.floorA : tex.floorB, tx(x), ty(y));
    ctx.fillStyle = 'rgba(80,150,110,0.12)';
    ctx.fillRect(0, 0, WM.VIEW_W, WM.VIEW_H);
};

WM.endings.bookstore.drawDecorations = function (ctx) {
    const self = this;
    const decos = this.decorations.slice().sort(function (a, b) { return a.y - b.y; });
    for (let i = 0; i < decos.length; i++) {
        const d = decos[i];
        const t = WM.tex[d.type];
        if (!t) continue;
        let ox = 0;
        if (d.type === 'bookshelf' && self.shakeShelf != null &&
            d.x === self.targetShelf.x && d.y === self.targetShelf.y) {
            ox = self.shakeShelf;
        }
        ctx.drawImage(t, d.x + ox, d.y);
    }
    for (let i = 0; i < this.bookFly.length; i++) {
        const b = this.bookFly[i];
        ctx.fillStyle = WM.PAL.cyan;
        ctx.fillRect(Math.round(b.x), Math.round(b.y), 6, 4);
        ctx.fillStyle = WM.PAL.white;
        ctx.fillRect(Math.round(b.x), Math.round(b.y), 6, 1);
    }
};

WM.endings.bookstore.drawTaskPoint = function (ctx) {
    const bob = Math.sin(Date.now() / 300) * 3;
    ctx.drawImage(WM.tex.star, this.taskPoint.x - 8, this.taskPoint.y - 22 + bob);
};

WM.endings.bookstore.playTaskAnim = function (dt) {
    this.animTimer += dt;
    if (this.animTimer < 1000) {
        this.shakeShelf = Math.sin(this.animTimer / 40) * 2;
    } else {
        this.shakeShelf = null;
    }
    if (this.animTimer >= 1000 && this.bookFly.length === 0) {
        const sx = this.targetShelf.x + 16, sy = this.targetShelf.y + 40;
        const tx = this.player.x - 3, ty = this.player.y - 10;
        const steps = 60;
        this.bookFly.push({
            x: sx, y: sy,
            vx: (tx - sx) / steps, vy: (ty - sy) / steps,
        });
    }
    for (let i = 0; i < this.bookFly.length; i++) {
        const b = this.bookFly[i];
        b.x += b.vx; b.y += b.vy;
    }
    if (this.animTimer >= 2000) {
        this.player.holding = true;
        this.bookFly = [];
    }
    if (this.animTimer >= 2800) {
        this.onAnimDone();
    }
};
