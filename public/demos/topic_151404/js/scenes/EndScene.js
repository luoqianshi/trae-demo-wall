/**
 * 结算场景
 * 显示胜利/失败结果、生存统计数据、重新开始按钮
 * 使用 HTML 中已有的 DOM 元素
 */

(function() {

class EndScene extends Scene {
    constructor(game) {
        super(game);

        this.endScreen = null;
        this.endTitle = null;
        this.endSubtitle = null;
        this.statTime = null;
        this.statDays = null;
        this.statResources = null;
        this.statCrafted = null;
        this.restartBtn = null;
        this.menuBtn = null;
    }

    _init() {
        this._createBackground();
        this._setupUI();
    }

    _createBackground() {
        const bg = new PIXI.Graphics();

        bg.beginFill(0x87CEEB);
        bg.drawRect(0, 0, this.viewWidth, this.viewHeight);
        bg.endFill();

        bg.beginFill(0xFFFFFF, 0.8);
        this._drawCloud(bg, 80, 100, 70);
        this._drawCloud(bg, 350, 60, 50);
        this._drawCloud(bg, 600, 120, 65);
        this._drawCloud(bg, 800, 80, 45);
        bg.endFill();

        const groundY = this.viewHeight * 0.7;
        bg.beginFill(0x7CB342);
        bg.drawRect(0, groundY, this.viewWidth, this.viewHeight - groundY);
        bg.endFill();

        bg.beginFill(0x5D9B3A);
        for (let i = 0; i < this.viewWidth; i += 30) {
            const h = 5 + Math.random() * 8;
            bg.drawRect(i, groundY - h, 3, h);
            bg.drawRect(i + 10, groundY - h - 2, 3, h + 2);
            bg.drawRect(i + 20, groundY - h + 1, 3, h - 1);
        }
        bg.endFill();

        this.bgGraphics = bg;
        this.container.addChild(bg);
    }

    _drawCloud(g, x, y, size) {
        g.drawRect(x, y, size, size * 0.4);
        g.drawRect(x + size * 0.15, y - size * 0.2, size * 0.5, size * 0.3);
        g.drawRect(x + size * 0.4, y - size * 0.15, size * 0.45, size * 0.35);
    }

    _setupUI() {
        this.endScreen = document.getElementById('end-screen');
        this.endTitle = document.getElementById('end-title');
        this.endSubtitle = document.getElementById('end-subtitle');
        this.statTime = document.getElementById('stat-time');
        this.statDays = document.getElementById('stat-days');
        this.statResources = document.getElementById('stat-resources');
        this.statCrafted = document.getElementById('stat-crafted');
        this.restartBtn = document.getElementById('restart-btn');
        this.menuBtn = document.getElementById('menu-btn');

        if (this.restartBtn) {
            this.restartBtn.addEventListener('click', () => {
                this._onRestart();
            });
        }

        if (this.menuBtn) {
            this.menuBtn.addEventListener('click', () => {
                this._onBackToStart();
            });
        }
    }

    _onEnter() {
        if (this.endScreen) {
            this.endScreen.classList.remove('hidden');
        }

        let result = null;
        if (typeof window.gameResult !== 'undefined') {
            result = window.gameResult;
        } else if (this.game) {
            result = this.game.gameResult;
        }

        this._updateResult(result);
        this._updateStats(result);
    }

    _onExit() {
        if (this.endScreen) {
            this.endScreen.classList.add('hidden');
        }
    }

    _updateResult(result) {
        const isVictory = result && result.victory;

        if (this.endTitle) {
            if (isVictory) {
                this.endTitle.textContent = '挑战成功！';
                this.endTitle.className = 'end-title victory';
            } else {
                this.endTitle.textContent = '挑战失败';
                this.endTitle.className = 'end-title defeat';
            }
        }

        if (this.endSubtitle) {
            if (isVictory) {
                this.endSubtitle.textContent = '你成功撑过了100小时，救援已到达！';
            } else {
                this.endSubtitle.textContent = '你没能撑过救援到达的时间...再试一次吧！';
            }
        }
    }

    _updateStats(result) {
        const stats = result?.stats || {};
        const survivalTime = stats.survivalTime || 0;
        const days = Math.floor(survivalTime / 24) + 1;

        if (this.statTime) {
            this.statTime.textContent = Math.floor(survivalTime);
        }
        if (this.statDays) {
            this.statDays.textContent = days;
        }
        if (this.statResources) {
            this.statResources.textContent = stats.resourcesCollected || 0;
        }
        if (this.statCrafted) {
            this.statCrafted.textContent = stats.itemsCrafted || 0;
        }
    }

    _onRestart() {
        gameManager.init(gameManager.difficulty);
        this.changeScene('game');
    }

    _onBackToStart() {
        this.changeScene('start');
    }

    _onUpdate(delta) {
    }
}

window.EndScene = EndScene;

})();
