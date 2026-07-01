'use strict';

WM.scenes.walk = {
    config: null,
    progress: 0,
    charFrame: 0,
    charTimer: 0,
    scrollX: 0,
    arrived: false,

    lightenColor: function (hex, amt) {
        var h = hex.replace('#', '');
        var r = parseInt(h.substring(0, 2), 16);
        var g = parseInt(h.substring(2, 4), 16);
        var b = parseInt(h.substring(4, 6), 16);
        r = Math.min(255, r + amt);
        g = Math.min(255, g + amt);
        b = Math.min(255, b + amt);
        return 'rgb(' + r + ',' + g + ',' + b + ')';
    },

    init: function (stageConfig) {
        this.config = stageConfig;
        this.progress = 0;
        WM.state.progress = 0;
        this.charFrame = 0;
        this.charTimer = 0;
        this.scrollX = 0;
        this.arrived = false;
        var elems = stageConfig.walk.dynamicElements || [];
        for (var i = 0; i < elems.length; i++) {
            var fx = WM.walkEffects[elems[i]];
            if (fx && typeof fx.init === 'function') fx.init();
        }
        WM.setProgress('行进中 0%');
    },

    update: function (dt) {
        if (this.progress < 100) {
            this.progress += dt / 70;
            if (this.progress >= 100) {
                this.progress = 100;
                if (!this.arrived) {
                    this.arrived = true;
                    WM.flow.arriveDestination();
                }
            }
            WM.state.progress = this.progress;
            WM.setProgress('行进中 ' + Math.floor(this.progress) + '%');
        }

        this.charTimer += dt;
        if (this.charTimer > 150) {
            this.charFrame = this.charFrame ? 0 : 1;
            this.charTimer = 0;
        }

        this.scrollX += dt * 0.05;

        var elems = this.config.walk.dynamicElements || [];
        for (var i = 0; i < elems.length; i++) {
            var fx = WM.walkEffects[elems[i]];
            if (fx && typeof fx.update === 'function') fx.update(dt);
        }
    },

    draw: function (ctx) {
        var W = WM.VIEW_W, H = WM.VIEW_H, PAL = WM.PAL;
        var walk = this.config.walk;
        var groundY = Math.round(H * 0.7);
        var p = this.progress;

        var grad = ctx.createLinearGradient(0, 0, 0, groundY);
        grad.addColorStop(0, walk.skyColor);
        grad.addColorStop(1, this.lightenColor(walk.skyColor, 60));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, groundY);

        this.drawMidground(ctx, walk.style, walk.midColor, groundY);

        ctx.fillStyle = walk.groundColor;
        ctx.fillRect(0, groundY, W, H - groundY);
        ctx.fillStyle = PAL.grass;
        ctx.fillRect(0, groundY, W, 6);
        ctx.fillStyle = PAL.plant;
        ctx.fillRect(0, groundY + 6, W, 1);

        var elems = walk.dynamicElements || [];
        for (var i = 0; i < elems.length; i++) {
            var fx = WM.walkEffects[elems[i]];
            if (fx && typeof fx.draw === 'function') fx.draw(ctx);
        }

        var charX = W * 0.15 + (p / 100) * (W * 0.6);
        var charY = groundY - 16;
        ctx.drawImage(WM.tex.player[3][this.charFrame], Math.round(charX), Math.round(charY));

        this.drawFlag(ctx, W * 0.78, groundY);

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, H - 8, W, 8);
        ctx.fillStyle = PAL.lamp;
        ctx.fillRect(0, H - 8, W * p / 100, 8);

        var prevAlign = ctx.textAlign;
        ctx.fillStyle = PAL.white;
        ctx.font = 'bold 11px "Microsoft YaHei", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('STAGE ' + (this.config.index + 1) + ' · 前往' + this.config.name, W / 2, 16);
        ctx.textAlign = prevAlign;
    },

    drawMidground: function (ctx, style, midColor, groundY) {
        var W = WM.VIEW_W, H = WM.VIEW_H, PAL = WM.PAL;
        var off, x, i;

        if (style === 'city') {
            off = (this.scrollX * 8) % 60;
            var types = [0, 1, 2, 0, 1, 2, 0, 1, 2, 0];
            for (i = 0; i < types.length; i++) {
                x = i * 60 - off - 30;
                ctx.drawImage(WM.tex.building[types[i]], Math.round(x), groundY - 48);
            }
            ctx.fillStyle = 'rgba(26,42,74,0.35)';
            ctx.fillRect(0, groundY - 48, W, 48);
        } else if (style === 'forest') {
            ctx.fillStyle = midColor;
            for (i = 0; i < 14; i++) {
                x = ((i * 60 - (this.scrollX * 6) % 60) % (W + 120)) - 30;
                var hillH = 30 + (i % 3) * 10;
                ctx.beginPath();
                ctx.moveTo(x, groundY);
                ctx.lineTo(x + 30, groundY - hillH);
                ctx.lineTo(x + 60, groundY);
                ctx.closePath();
                ctx.fill();
            }
            off = (this.scrollX * 10) % 48;
            for (i = 0; i < 12; i++) {
                x = i * 48 - off - 24;
                ctx.drawImage(WM.tex.tree, Math.round(x), groundY - 32);
            }
        } else if (style === 'commercial') {
            var neonCols = [PAL.red, PAL.cyan, PAL.yellow, PAL.green, PAL.shirtLt, PAL.bldgWindow2];
            off = (this.scrollX * 8) % 70;
            for (i = 0; i < 9; i++) {
                x = i * 70 - off - 35;
                var bh = 50 + (i % 3) * 14;
                ctx.fillStyle = midColor;
                ctx.fillRect(Math.round(x), groundY - bh, 56, bh);
                ctx.fillStyle = 'rgba(0,0,0,0.35)';
                ctx.fillRect(Math.round(x), groundY - bh, 56, bh);
                ctx.fillStyle = neonCols[i % neonCols.length];
                ctx.fillRect(Math.round(x) + 8, groundY - bh + 10, 40, 6);
                ctx.fillStyle = neonCols[(i + 2) % neonCols.length];
                ctx.fillRect(Math.round(x) + 14, groundY - bh + 24, 28, 4);
            }
        } else if (style === 'seaside') {
            var seaTop = groundY - 34;
            ctx.fillStyle = midColor;
            ctx.fillRect(0, seaTop, W, 34);
            ctx.fillStyle = this.lightenColor(midColor, 30);
            ctx.fillRect(0, seaTop, W, 2);
            ctx.fillStyle = 'rgba(58,90,122,0.9)';
            var moff = (this.scrollX * 4) % 160;
            for (i = 0; i < 5; i++) {
                x = i * 160 - moff - 80;
                ctx.beginPath();
                ctx.moveTo(x, seaTop);
                ctx.lineTo(x + 80, seaTop - 40);
                ctx.lineTo(x + 160, seaTop);
                ctx.closePath();
                ctx.fill();
            }
        }
    },

    drawFlag: function (ctx, fx, groundY) {
        var PAL = WM.PAL;
        var poleX = Math.round(fx);
        var poleTop = groundY - 34;
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(poleX, poleTop, 2, 34);
        ctx.fillStyle = PAL.red;
        ctx.beginPath();
        ctx.moveTo(poleX + 2, poleTop);
        ctx.lineTo(poleX + 18, poleTop + 6);
        ctx.lineTo(poleX + 2, poleTop + 12);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#888888';
        ctx.fillRect(poleX - 3, groundY - 1, 8, 2);
    },

    handleInput: function () {},

    isDone: function () {
        return this.arrived;
    }
};

WM.walkEffects = {
    lamp_glow: {
        lamps: [],
        t: 0,
        init: function () {
            this.t = 0;
            this.lamps = [];
            var xs = [70, 180, 290, 400];
            for (var i = 0; i < xs.length; i++) {
                this.lamps.push({ x: xs[i], phase: i * 1.3 });
            }
        },
        update: function (dt) {
            this.t += dt;
        },
        draw: function (ctx) {
            var groundY = Math.round(WM.VIEW_H * 0.7);
            var cy = groundY - 28;
            for (var i = 0; i < this.lamps.length; i++) {
                var l = this.lamps[i];
                var a = 0.18 + 0.14 * Math.sin(this.t / 600 + l.phase);
                var grad = ctx.createRadialGradient(l.x, cy, 0, l.x, cy, 34);
                grad.addColorStop(0, 'rgba(255,238,136,' + a + ')');
                grad.addColorStop(1, 'rgba(255,238,136,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(l.x - 34, cy - 34, 68, 68);
                ctx.fillStyle = WM.PAL.lamp;
                ctx.fillRect(l.x - 1, cy - 2, 3, 4);
            }
        }
    },

    leaf_fall: {
        leaves: [],
        init: function () {
            this.leaves = [];
            var cols = ['#4a7c3a', '#8aa84a', '#c8b048', '#6b8e3a'];
            for (var i = 0; i < 15; i++) {
                this.leaves.push({
                    x: Math.random() * WM.VIEW_W,
                    y: Math.random() * WM.VIEW_H,
                    vy: 0.012 + Math.random() * 0.018,
                    swing: 6 + Math.random() * 8,
                    phase: Math.random() * Math.PI * 2,
                    sp: 0.002 + Math.random() * 0.003,
                    size: 2 + Math.floor(Math.random() * 2),
                    color: cols[i % cols.length]
                });
            }
        },
        update: function (dt) {
            var groundY = Math.round(WM.VIEW_H * 0.7);
            for (var i = 0; i < this.leaves.length; i++) {
                var lf = this.leaves[i];
                lf.y += lf.vy * dt;
                lf.phase += lf.sp * dt;
                if (lf.y > groundY) {
                    lf.y = -4;
                    lf.x = Math.random() * WM.VIEW_W;
                }
            }
        },
        draw: function (ctx) {
            for (var i = 0; i < this.leaves.length; i++) {
                var lf = this.leaves[i];
                var dx = Math.sin(lf.phase) * lf.swing;
                ctx.fillStyle = lf.color;
                ctx.fillRect(Math.round(lf.x + dx), Math.round(lf.y), lf.size, lf.size);
            }
        }
    },

    light_spot: {
        spots: [],
        t: 0,
        init: function () {
            this.t = 0;
            this.spots = [];
            var groundY = Math.round(WM.VIEW_H * 0.7);
            for (var i = 0; i < 10; i++) {
                this.spots.push({
                    x: Math.random() * WM.VIEW_W,
                    y: groundY + 8 + Math.random() * (WM.VIEW_H - groundY - 16),
                    phase: Math.random() * Math.PI * 2,
                    sp: 0.001 + Math.random() * 0.002,
                    r: 2 + Math.floor(Math.random() * 3)
                });
            }
        },
        update: function (dt) {
            this.t += dt;
        },
        draw: function (ctx) {
            for (var i = 0; i < this.spots.length; i++) {
                var s = this.spots[i];
                var a = 0.15 + 0.25 * (0.5 + 0.5 * Math.sin(this.t * s.sp + s.phase));
                ctx.fillStyle = 'rgba(255,255,210,' + a.toFixed(3) + ')';
                ctx.fillRect(Math.round(s.x - s.r), Math.round(s.y), s.r * 2, 2);
                ctx.fillRect(Math.round(s.x - 1), Math.round(s.y - 1), 2, s.r);
            }
        }
    },

    neon_flicker: {
        blocks: [],
        init: function () {
            this.blocks = [];
            var PAL = WM.PAL;
            var cols = [PAL.red, PAL.cyan, PAL.yellow, PAL.green, PAL.shirtLt, PAL.bldgWindow2];
            var defs = [
                { x: 40, y: 60, w: 28, h: 10 },
                { x: 150, y: 40, w: 36, h: 12 },
                { x: 250, y: 70, w: 24, h: 9 },
                { x: 340, y: 50, w: 40, h: 11 },
                { x: 430, y: 64, w: 26, h: 10 }
            ];
            for (var i = 0; i < defs.length; i++) {
                this.blocks.push({
                    x: defs[i].x, y: defs[i].y, w: defs[i].w, h: defs[i].h,
                    color: cols[i % cols.length],
                    on: true,
                    timer: 0,
                    next: 200 + Math.random() * 600,
                    cols: cols
                });
            }
        },
        update: function (dt) {
            for (var i = 0; i < this.blocks.length; i++) {
                var b = this.blocks[i];
                b.timer += dt;
                if (b.timer >= b.next) {
                    b.timer = 0;
                    b.next = 150 + Math.random() * 700;
                    if (Math.random() < 0.5) {
                        b.on = !b.on;
                    } else {
                        b.color = b.cols[Math.floor(Math.random() * b.cols.length)];
                        b.on = true;
                    }
                }
            }
        },
        draw: function (ctx) {
            for (var i = 0; i < this.blocks.length; i++) {
                var b = this.blocks[i];
                if (!b.on) continue;
                ctx.fillStyle = b.color;
                ctx.fillRect(b.x, b.y, b.w, b.h);
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.fillRect(b.x, b.y, b.w, 1);
            }
        }
    },

    pedestrian: {
        peds: [],
        init: function () {
            this.peds = [];
            var groundY = Math.round(WM.VIEW_H * 0.7);
            for (var i = 0; i < 5; i++) {
                this.peds.push({
                    x: WM.VIEW_W + i * 110 + Math.random() * 80,
                    y: groundY - 18,
                    speed: 0.03 + Math.random() * 0.04,
                    frame: 0,
                    timer: 0,
                    shade: i % 2 === 0 ? 'rgba(20,20,30,0.85)' : 'rgba(40,30,40,0.85)'
                });
            }
        },
        update: function (dt) {
            for (var i = 0; i < this.peds.length; i++) {
                var pd = this.peds[i];
                pd.x -= pd.speed * dt;
                pd.timer += dt;
                if (pd.timer > 160) { pd.frame = pd.frame ? 0 : 1; pd.timer = 0; }
                if (pd.x < -14) {
                    pd.x = WM.VIEW_W + 10 + Math.random() * 120;
                    pd.speed = 0.03 + Math.random() * 0.04;
                }
            }
        },
        draw: function (ctx) {
            for (var i = 0; i < this.peds.length; i++) {
                var pd = this.peds[i];
                var x = Math.round(pd.x), y = Math.round(pd.y);
                ctx.fillStyle = pd.shade;
                ctx.fillRect(x + 3, y, 4, 4);
                ctx.fillRect(x + 2, y + 4, 6, 8);
                var s = pd.frame;
                ctx.fillRect(x + 2, y + 12, 2, 4 + (s ? 1 : 0));
                ctx.fillRect(x + 6, y + 12, 2, 4 + (s ? 0 : 1));
            }
        }
    },

    wave_scroll: {
        t: 0,
        layers: [],
        init: function () {
            this.t = 0;
            this.layers = [
                { amp: 3, len: 60, speed: 0.05, yOff: -24, color: 'rgba(255,255,255,0.5)' },
                { amp: 4, len: 90, speed: 0.035, yOff: -14, color: 'rgba(200,230,255,0.45)' },
                { amp: 5, len: 130, speed: 0.022, yOff: -5, color: 'rgba(150,200,235,0.4)' }
            ];
        },
        update: function (dt) {
            this.t += dt;
        },
        draw: function (ctx) {
            var W = WM.VIEW_W;
            var groundY = Math.round(WM.VIEW_H * 0.7);
            for (var i = 0; i < this.layers.length; i++) {
                var l = this.layers[i];
                var baseY = groundY + l.yOff;
                var sh = this.t * l.speed;
                ctx.fillStyle = l.color;
                for (var x = 0; x < W; x += 2) {
                    var y = baseY + Math.sin((x + sh) / l.len * Math.PI * 2) * l.amp;
                    ctx.fillRect(x, Math.round(y), 2, 1);
                }
            }
        }
    },

    seagull: {
        birds: [],
        init: function () {
            this.birds = [];
            for (var i = 0; i < 3; i++) {
                this.birds.push({
                    x: -20 - i * 140,
                    baseY: 30 + i * 22,
                    speed: 0.04 + Math.random() * 0.03,
                    phase: Math.random() * Math.PI * 2,
                    flap: 0,
                    timer: 0
                });
            }
        },
        update: function (dt) {
            for (var i = 0; i < this.birds.length; i++) {
                var b = this.birds[i];
                b.x += b.speed * dt;
                b.phase += dt * 0.002;
                b.timer += dt;
                if (b.timer > 280) { b.flap = b.flap ? 0 : 1; b.timer = 0; }
                if (b.x > WM.VIEW_W + 20) {
                    b.x = -20 - Math.random() * 120;
                    b.baseY = 24 + Math.random() * 50;
                    b.speed = 0.04 + Math.random() * 0.03;
                }
            }
        },
        draw: function (ctx) {
            ctx.fillStyle = 'rgba(40,40,55,0.8)';
            for (var i = 0; i < this.birds.length; i++) {
                var b = this.birds[i];
                var x = Math.round(b.x);
                var y = Math.round(b.baseY + Math.sin(b.phase) * 6);
                var wy = b.flap ? -1 : 1;
                ctx.fillRect(x - 4, y + wy, 3, 1);
                ctx.fillRect(x - 2, y, 2, 1);
                ctx.fillRect(x, y - 1, 2, 1);
                ctx.fillRect(x + 2, y, 2, 1);
                ctx.fillRect(x + 4, y + wy, 3, 1);
            }
        }
    }
};
