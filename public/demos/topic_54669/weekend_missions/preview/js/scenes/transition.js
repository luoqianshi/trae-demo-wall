'use strict';

WM.scenes.transition = {
    config: null,
    t: 0,
    phase: 0,
    endingInited: false,

    init(stageConfig) {
        this.config = stageConfig;
        this.t = 0;
        this.phase = 0;
        this.endingInited = false;
    },

    update(dt) {
        this.t += dt;
        if (this.phase === 0) {
            if (this.t >= 400) {
                this.phase = 1;
                this.t = 0;
            }
        } else if (this.phase === 1) {
            if (this.t > 450 && !this.endingInited) {
                this.endingInited = true;
            }
            if (this.t >= 900) {
                this.phase = 2;
                this.t = 0;
            }
        } else if (this.phase === 2) {
            if (this.t >= 400) {
                WM.flow.enterEnding(WM.currentStage);
            }
        }
    },

    draw(ctx) {
        const W = WM.VIEW_W, H = WM.VIEW_H, PAL = WM.PAL;
        const coverH = H / 2;

        if (this.phase <= 1) {
            WM.scenes.walk.draw(ctx);
        } else {
            if (WM.currentEnding && typeof WM.currentEnding.draw === 'function') {
                WM.currentEnding.draw(ctx);
            } else {
                WM.scenes.walk.draw(ctx);
            }
        }

        let topBarH = 0, botBarH = 0;
        if (this.phase === 0) {
            const t = this.t / 400;
            const ease = 1 - Math.pow(1 - t, 3);
            topBarH = coverH * ease;
            botBarH = coverH * ease;
        } else if (this.phase === 1) {
            topBarH = coverH;
            botBarH = coverH;
        } else if (this.phase === 2) {
            const t = this.t / 400;
            const ease = Math.pow(t, 3);
            topBarH = coverH * (1 - ease);
            botBarH = coverH * (1 - ease);
        }

        ctx.fillStyle = PAL.black;
        ctx.fillRect(0, 0, W, topBarH);
        ctx.fillRect(0, H - botBarH, W, botBarH);

        if (this.phase === 1) {
            const cfg = this.config || {};
            const name = cfg.name || '';
            const taskTitle = (cfg.task && cfg.task.title) || '';
            const flicker = 0.7 + Math.sin(this.t / 100) * 0.3;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(255,215,0,' + flicker + ')';
            ctx.font = 'bold 16px "Microsoft YaHei", "Press Start 2P", sans-serif';
            ctx.fillText('进入' + name + '...', W / 2, H / 2 - 12);
            ctx.fillStyle = PAL.white;
            ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
            ctx.fillText('任务：' + taskTitle, W / 2, H / 2 + 14);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
        }
    },

    handleInput() {},

    isDone() {
        return this.phase >= 2 && this.t >= 400;
    },
};
