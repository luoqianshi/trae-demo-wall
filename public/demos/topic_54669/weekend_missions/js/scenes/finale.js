'use strict';

WM.scenes.finale = {
    t: 0,

    init: function () {
        this.t = 0;
        this._done = false;
    },

    update: function (dt) {
        this.t += dt;
        if (this.t >= 9000 && WM.onAllCleared && !this._done) {
            this._done = true;
            WM.onAllCleared();
        }
    },

    getRating: function (hp) {
        if (hp >= 40) return { letter: 'S', color: '#FFD700' };
        if (hp >= 20) return { letter: 'A', color: '#FFD700' };
        if (hp >= 1) return { letter: 'B', color: '#2ECC71' };
        return { letter: 'C', color: '#E74C3C' };
    },

    draw: function (ctx) {
        const W = WM.VIEW_W, H = WM.VIEW_H;
        const t = this.t;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = 'center';

        if (t >= 500) {
            const p = Math.min((t - 500) / 1000, 1);
            const scale = 1 + Math.sin(Math.min(p, 1) * Math.PI) * 0.25;
            ctx.save();
            ctx.translate(W / 2, 56);
            ctx.scale(scale, scale);
            ctx.fillStyle = '#FFD700';
            ctx.font = '20px "Press Start 2P", monospace';
            ctx.textBaseline = 'middle';
            ctx.fillText('MISSION REPORT READY', 0, 0);
            ctx.restore();
        }

        if (t >= 1500) {
            const a = Math.min((t - 1500) / 1500, 1);
            ctx.globalAlpha = a;
            ctx.fillStyle = '#00D2D3';
            ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
            ctx.textBaseline = 'middle';
            ctx.fillText('\u5168\u90e8\u8def\u7ebf\u603b\u89c8\u89c1\u4e0a\u65b9\u5730\u56fe', W / 2, 96);
            ctx.globalAlpha = 1;
        }

        if (t >= 3000) {
            const a = Math.min((t - 3000) / 1000, 1);
            ctx.globalAlpha = a;
            ctx.fillStyle = '#F8F8F8';
            ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
            ctx.textBaseline = 'middle';
            const lines = [
                '\u901a\u5173 ' + WM.STAGES.length + '/' + WM.STAGES.length,
                '\u603b\u82b1\u8d39 \u00a5' + WM.state.totalCost,
                '\u603b\u65f6\u957f ' + WM.state.totalDuration.toFixed(1) + 'h',
                '\u5269\u4f59HP ' + WM.state.hp + '/100',
            ];
            for (let i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], W / 2, 130 + i * 20);
            }
            ctx.globalAlpha = 1;
        }

        if (t >= 4000) {
            const a = Math.min((t - 4000) / 1000, 1);
            const rating = this.getRating(WM.state.hp);
            ctx.globalAlpha = a;
            ctx.save();
            ctx.fillStyle = rating.color;
            ctx.shadowColor = rating.color;
            ctx.shadowBlur = 20;
            ctx.font = '32px "Press Start 2P", monospace';
            ctx.textBaseline = 'middle';
            ctx.fillText(rating.letter, W / 2, 232);
            ctx.restore();
            ctx.globalAlpha = 1;
        }

        if (t >= 5000) {
            if (Math.floor(Date.now() / 500) % 2 === 0) {
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
                ctx.textBaseline = 'middle';
                ctx.fillText('按 Enter 查看通关卡', W / 2, H - 16);
            }
        }

        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    },

    handleInput: function (action) {
        if (action === 'enter') {
            if (WM.onAllCleared && !this._done) {
                this._done = true;
                WM.onAllCleared();
            }
        }
    },
};
