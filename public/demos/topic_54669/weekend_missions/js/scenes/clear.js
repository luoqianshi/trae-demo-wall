'use strict';

WM.scenes.clear = {
    config: null,
    t: 0,
    phase: 0,

    parseCost: function (cost) {
        if (!cost) return 0;
        const m = String(cost).match(/[\d.]+/);
        return m ? parseFloat(m[0]) : 0;
    },

    parseDuration: function (duration) {
        if (!duration) return 0;
        const s = String(duration);
        const num = parseFloat(s.match(/[\d.]+/) ? s.match(/[\d.]+/)[0] : '0');
        if (s.indexOf('min') !== -1) return num / 60;
        return num;
    },

    init: function (stageConfig) {
        this.config = stageConfig;
        this.t = 0;
        this.phase = 0;
        const task = stageConfig.task;
        WM.state.hp -= task.hp;
        WM.state.totalCost += this.parseCost(task.cost);
        WM.state.totalDuration += this.parseDuration(task.duration);
    },

    update: function (dt) {
        this.t += dt;
        if (this.phase === 0 && this.t > 200) { this.phase = 1; this.t = 0; }
        else if (this.phase === 1 && this.t > 400) { this.phase = 2; this.t = 0; }
        else if (this.phase === 2 && this.t > 600) { this.phase = 3; this.t = 0; }
        else if (this.phase === 3 && this.t > 2500) {
            if (WM.flow && typeof WM.flow.onClearDone === 'function') WM.flow.onClearDone();
        }
    },

    draw: function (ctx) {
        if (WM.currentEnding && typeof WM.currentEnding.draw === 'function') {
            WM.currentEnding.draw(ctx);
        }
        const W = WM.VIEW_W, H = WM.VIEW_H, PAL = WM.PAL;

        if (this.phase === 0) {
            ctx.fillStyle = 'rgba(255,255,255,' + (1 - this.t / 200) + ')';
            ctx.fillRect(0, 0, W, H);
        }

        if (this.phase >= 1) {
            const t = this.phase === 1 ? this.t / 400 : 1;
            const ease = 1 - Math.pow(1 - t, 3);
            const barH = H / 2 * ease;
            ctx.fillStyle = PAL.black;
            ctx.fillRect(0, 0, W, barH);
            ctx.fillRect(0, H - barH, W, barH);
        }

        if (this.phase >= 2) {
            const t = this.phase === 2 ? this.t / 600 : 1;
            const scale = 1 + Math.sin(t * Math.PI) * 0.3;
            ctx.save();
            ctx.translate(W / 2, H / 2 - 20);
            ctx.scale(scale, scale);
            ctx.fillStyle = PAL.lamp;
            ctx.font = 'bold 24px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeStyle = PAL.black;
            ctx.lineWidth = 4;
            ctx.strokeText('STAGE CLEAR', 0, 0);
            ctx.fillText('STAGE CLEAR', 0, 0);
            ctx.restore();
        }

        if (this.phase === 3) {
            const task = this.config.task;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = PAL.white;
            ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
            ctx.fillText('\u2713 ' + task.title, W / 2, H / 2 + 22);
            ctx.fillStyle = PAL.lampGlow;
            ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
            ctx.fillText('\u82b1\u8d39 ' + task.cost + '   \u65f6\u957f ' + task.duration + '   HP -' + task.hp, W / 2, H / 2 + 44);
            if (Math.floor(Date.now() / 500) % 2 === 0) {
                ctx.fillStyle = '#888';
                ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
                ctx.fillText('STAGE ' + (this.config.index + 1) + ' \u5b8c\u6210\uff01', W / 2, H / 2 + 70);
            }
            ctx.textAlign = 'left';
        }
    },

    handleInput: function () {},

    isDone: function () {
        return this.phase >= 3 && this.t >= 2500;
    },
};
