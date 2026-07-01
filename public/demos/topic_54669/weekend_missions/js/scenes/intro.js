'use strict';

WM.scenes.intro = {
    config: null,
    t: 0,
    skipped: false,

    init: function (stageConfig) {
        this.config = stageConfig;
        this.t = 0;
        this.skipped = false;
    },

    update: function (dt) {
        this.t += dt;
    },

    drawScanlines: function (ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        for (var y = 0; y < WM.VIEW_H; y += 3) {
            ctx.fillRect(0, y, WM.VIEW_W, 1);
        }
    },

    draw: function (ctx) {
        var PAL = WM.PAL;
        var cx = WM.VIEW_W / 2;
        var t = this.t;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, WM.VIEW_W, WM.VIEW_H);

        var prevAlign = ctx.textAlign;
        var prevBaseline = ctx.textBaseline;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (t >= 200) {
            var stageY = WM.VIEW_H / 2 - 40;
            var enter = Math.min((t - 200) / 300, 1);
            var scale = enter < 1 ? 0.4 + 0.6 * (1 - Math.pow(1 - enter, 3)) : 1;
            var blink = 1;
            if (t >= 500 && t < 1200) {
                var phase = (t - 500) / 350;
                blink = Math.sin(phase * Math.PI) >= 0 ? 1 : 0.25;
                if (phase >= 2) blink = 1;
            }
            ctx.save();
            ctx.translate(cx, stageY);
            ctx.scale(scale, scale);
            ctx.globalAlpha = blink;
            ctx.fillStyle = PAL.yellow;
            ctx.font = '24px "Press Start 2P", monospace';
            ctx.fillText('STAGE ' + (this.config.index + 1), 0, 0);
            ctx.restore();
            ctx.globalAlpha = 1;
        }

        if (t >= 1200) {
            var slide = Math.min((t - 1200) / 400, 1);
            var ease = 1 - Math.pow(1 - slide, 3);
            var targetY = WM.VIEW_H / 2 + 4;
            var nameY = targetY + (1 - ease) * 40;
            ctx.globalAlpha = ease;
            ctx.fillStyle = PAL.white;
            ctx.font = 'bold 16px "Microsoft YaHei", "PingFang SC", sans-serif';
            ctx.fillText(this.config.name, cx, nameY);
            ctx.globalAlpha = 1;
        }

        if (t >= 1800) {
            var fade = Math.min((t - 1800) / 400, 1);
            ctx.globalAlpha = fade;
            ctx.fillStyle = PAL.cyan;
            ctx.font = '10px "Microsoft YaHei", "PingFang SC", sans-serif';
            ctx.fillText('任务：' + this.config.task.title, cx, WM.VIEW_H / 2 + 40);
            ctx.globalAlpha = 1;
        }

        if (t >= 2400) {
            var pulse = 0.5 + 0.5 * Math.sin((t - 2400) / 400);
            ctx.globalAlpha = pulse;
            ctx.fillStyle = PAL.yellow;
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillText('PRESS SPACE', cx, WM.VIEW_H - 24);
            ctx.globalAlpha = 1;
        }

        ctx.textAlign = prevAlign;
        ctx.textBaseline = prevBaseline;

        this.drawScanlines(ctx);
    },

    handleInput: function (action) {
        if ((action === 'space' || action === 'click') && this.t > 500) {
            this.skipped = true;
            WM.flow.enterWalk(WM.currentStage);
        }
    },

    isDone: function () {
        return this.skipped;
    }
};
