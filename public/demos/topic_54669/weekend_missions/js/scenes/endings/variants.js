'use strict';

WM.endingVariantHelpers = {
    rect: function (ctx, x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    },
    text: function (ctx, text, x, y, color, size) {
        ctx.fillStyle = color;
        ctx.font = (size || 8) + 'px "Microsoft YaHei", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(text, Math.round(x), Math.round(y));
        ctx.textAlign = 'left';
    },
    lantern: function (ctx, x, y) {
        this.rect(ctx, x, y, 2, 18, '#6b4423');
        this.rect(ctx, x - 7, y + 16, 16, 11, '#e74c3c');
        this.rect(ctx, x - 5, y + 18, 12, 7, '#ff8a4a');
        this.rect(ctx, x - 3, y + 27, 8, 2, '#f1c40f');
    },
    bowl: function (ctx, x, y) {
        this.rect(ctx, x - 13, y - 4, 26, 8, '#f5e6c8');
        this.rect(ctx, x - 10, y + 4, 20, 4, '#8b7355');
        this.rect(ctx, x - 8, y - 7, 16, 3, '#ffe0a3');
        const t = Date.now() / 360;
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        for (let i = 0; i < 3; i++) ctx.fillRect(Math.round(x - 6 + i * 6 + Math.sin(t + i) * 2), Math.round(y - 15 - i * 3), 2, 5);
    },
    painting: function (ctx, x, y, color) {
        this.rect(ctx, x, y, 42, 30, '#f5e6c8');
        this.rect(ctx, x + 3, y + 3, 36, 24, color);
        this.rect(ctx, x + 8, y + 9, 10, 10, '#ffffff');
        this.rect(ctx, x + 22, y + 7, 11, 14, '#1a2a4a');
    },
    skyline: function (ctx, baseY) {
        const xs = [250, 280, 308, 344, 382, 420];
        const hs = [42, 68, 50, 76, 46, 58];
        for (let i = 0; i < xs.length; i++) {
            this.rect(ctx, xs[i], baseY - hs[i], 22, hs[i], '#111827');
            this.rect(ctx, xs[i] + 5, baseY - hs[i] + 8, 3, 3, '#f1c40f');
        }
        this.rect(ctx, 326, baseY - 88, 6, 88, '#111827');
        this.rect(ctx, 318, baseY - 70, 22, 10, '#e74c3c');
        this.rect(ctx, 315, baseY - 45, 28, 12, '#f1c40f');
    },
};

WM.endingVariants = {
    'hangzhou-noodle': {
        drawBack: function (ctx) {
            const h = WM.endingVariantHelpers;
            h.rect(ctx, 24, 34, 116, 28, '#6b4423');
            h.rect(ctx, 34, 42, 96, 13, '#8b7355');
            h.text(ctx, '片儿川', 82, 53, '#ffe066', 10);
            h.lantern(ctx, 154, 14);
            h.lantern(ctx, 338, 14);
            h.rect(ctx, 20, 124, 168, 16, '#8b7355');
        },
        drawFront: function (ctx, stage, ending) {
            WM.endingVariantHelpers.bowl(ctx, ending.taskPoint.x, ending.taskPoint.y - 8);
        },
    },
    'hangzhou-gallery': {
        drawBack: function (ctx) {
            const h = WM.endingVariantHelpers;
            h.rect(ctx, 0, 0, WM.VIEW_W, 100, 'rgba(245,230,200,0.28)');
            h.painting(ctx, 48, 28, '#00d2d3');
            h.painting(ctx, 154, 24, '#ff9a5a');
            h.painting(ctx, 260, 30, '#4a7c3a');
            h.painting(ctx, 366, 24, '#f1c40f');
        },
        drawFront: function (ctx, stage, ending) {
            const h = WM.endingVariantHelpers;
            h.rect(ctx, ending.taskPoint.x - 20, ending.taskPoint.y - 14, 40, 12, '#f5e6c8');
            h.rect(ctx, ending.taskPoint.x - 14, ending.taskPoint.y - 28, 28, 16, '#8fbfe8');
        },
    },
    'hangzhou-oldstreet': {
        drawBack: function (ctx) {
            const h = WM.endingVariantHelpers;
            h.rect(ctx, 0, 0, WM.VIEW_W, 112, 'rgba(50,70,60,0.35)');
            for (let x = 18; x < WM.VIEW_W; x += 84) {
                h.rect(ctx, x, 54, 58, 34, '#6b5333');
                h.rect(ctx, x + 4, 60, 50, 8, '#8b7355');
                h.lantern(ctx, x + 48, 30);
            }
        },
        drawFront: function (ctx, stage, ending) {
            const h = WM.endingVariantHelpers;
            h.rect(ctx, ending.taskPoint.x - 22, ending.taskPoint.y - 18, 44, 18, '#8b7355');
            h.rect(ctx, ending.taskPoint.x - 16, ending.taskPoint.y - 28, 32, 10, '#f1c40f');
            h.text(ctx, '纪念品', ending.taskPoint.x, ending.taskPoint.y - 20, '#4a2f1a', 8);
        },
    },
    'hangzhou-sunset': {
        drawBack: function (ctx) {
            const h = WM.endingVariantHelpers;
            h.rect(ctx, 58, 92, 54, 10, '#2f3f2d');
            h.rect(ctx, 82, 70, 6, 22, '#2f3f2d');
            h.rect(ctx, 74, 64, 22, 8, '#2f3f2d');
            h.rect(ctx, 66, 106, 30, 12, '#6B5333');
            h.text(ctx, '西湖', 82, 116, '#f5e6c8', 8);
        },
        drawFront: function (ctx, stage, ending) {
            const h = WM.endingVariantHelpers;
            h.rect(ctx, ending.taskPoint.x - 28, ending.taskPoint.y - 20, 56, 12, '#4a6b3d');
            h.rect(ctx, ending.taskPoint.x - 18, ending.taskPoint.y - 30, 36, 10, '#8B7355');
        },
    },
    'shanghai-restaurant': {
        drawBack: function (ctx) {
            const h = WM.endingVariantHelpers;
            h.rect(ctx, 36, 35, 96, 32, '#7f1d1d');
            h.text(ctx, '本帮菜', 84, 55, '#f1c40f', 10);
            h.rect(ctx, 278, 34, 86, 28, '#3a1a3a');
            h.text(ctx, '红烧肉', 321, 52, '#f1c40f', 9);
        },
        drawFront: function (ctx, stage, ending) {
            const h = WM.endingVariantHelpers;
            const x = ending.taskPoint.x, y = ending.taskPoint.y;
            ctx.fillStyle = '#8b5a2b';
            ctx.beginPath();
            ctx.arc(x, y - 10, 22, 0, Math.PI * 2);
            ctx.fill();
            h.rect(ctx, x - 10, y - 17, 20, 9, '#e74c3c');
            h.rect(ctx, x + 16, y - 22, 2, 23, '#f5e6c8');
            h.rect(ctx, x + 21, y - 22, 2, 23, '#f5e6c8');
        },
    },
    'shanghai-lilong-art': {
        drawBack: function (ctx) {
            const h = WM.endingVariantHelpers;
            h.rect(ctx, 0, 0, WM.VIEW_W, 100, 'rgba(127,29,29,0.35)');
            h.text(ctx, 'ART', 74, 64, '#00d2d3', 16);
            h.text(ctx, '田子坊', 198, 54, '#f1c40f', 12);
            h.rect(ctx, 320, 34, 64, 44, '#111827');
            h.rect(ctx, 326, 40, 52, 32, '#e74c3c');
        },
        drawFront: function (ctx, stage, ending) {
            const h = WM.endingVariantHelpers;
            h.rect(ctx, ending.taskPoint.x - 24, ending.taskPoint.y - 34, 48, 34, '#f5e6c8');
            h.rect(ctx, ending.taskPoint.x - 18, ending.taskPoint.y - 28, 36, 22, '#1a2a4a');
        },
    },
    'shanghai-nanjing-road': {
        drawBack: function (ctx) {
            const h = WM.endingVariantHelpers;
            [{ x: 38, y: 26, w: 68, c: '#e74c3c', t: '老字号' }, { x: 146, y: 42, w: 74, c: '#f1c40f', t: '南京路' }, { x: 268, y: 28, w: 86, c: '#00d2d3', t: '伴手礼' }].forEach(function (s) {
                h.rect(ctx, s.x, s.y, s.w, 16, s.c);
                h.text(ctx, s.t, s.x + s.w / 2, s.y + 12, '#111827', 8);
            });
        },
        drawFront: function (ctx, stage, ending) {
            const h = WM.endingVariantHelpers;
            h.rect(ctx, ending.taskPoint.x - 24, ending.taskPoint.y - 22, 48, 22, '#f1c40f');
            h.text(ctx, '伴手礼', ending.taskPoint.x, ending.taskPoint.y - 8, '#111827', 8);
        },
    },
    'shanghai-bund': {
        drawBack: function (ctx) {
            const h = WM.endingVariantHelpers;
            h.rect(ctx, 0, 82, WM.VIEW_W, 68, 'rgba(26,42,74,0.55)');
            h.skyline(ctx, 126);
            for (let y = 92; y < 144; y += 13) h.rect(ctx, 260, y, 160, 1, 'rgba(241,196,15,0.35)');
        },
        drawFront: function (ctx) {
            const h = WM.endingVariantHelpers;
            h.rect(ctx, 0, 154, WM.VIEW_W, 4, '#f1c40f');
            for (let x = 0; x < WM.VIEW_W; x += 28) h.rect(ctx, x, 146, 3, 18, '#f1c40f');
        },
    },
};

WM.drawEndingVariant = function (ending, layer, ctx) {
    if (!ending || !ending.config || !ending.config.ending) return;
    const name = ending.config.ending.variant;
    if (!name || !WM.endingVariants) return;
    const variant = WM.endingVariants[name];
    if (!variant) return;
    const fn = layer === 'back' ? variant.drawBack : variant.drawFront;
    if (typeof fn === 'function') fn.call(variant, ctx, ending.config, ending);
};
