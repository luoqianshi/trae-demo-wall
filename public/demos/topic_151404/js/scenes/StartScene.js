/**
 * 开始场景
 * 显示游戏标题、难度选择（简单/普通/困难）、开始按钮
 * 使用 HTML 中已有的 DOM 元素
 */

(function() {

class StartScene extends Scene {
    constructor(game) {
        super(game);

        this.selectedDifficulty = 'normal';
        this.startScreen = null;
        this.difficultyBtns = [];
        this.startBtn = null;
        this.diffHint = null;
    }

    _init() {
        this._createBackground();
        this._setupUI();
    }

    _createBackground() {
        const bg = new PIXI.Graphics();

        const skyHeight = this.viewHeight * 0.6;
        bg.beginFill(0x87CEEB);
        bg.drawRect(0, 0, this.viewWidth, skyHeight);
        bg.endFill();

        bg.beginFill(0xFFFFFF);
        this._drawCloud(bg, 100, 80, 60);
        this._drawCloud(bg, 300, 50, 45);
        this._drawCloud(bg, 550, 100, 55);
        this._drawCloud(bg, 750, 60, 40);
        bg.endFill();

        const oceanY = skyHeight;
        const oceanHeight = this.viewHeight * 0.2;
        bg.beginFill(0x4A90D9);
        bg.drawRect(0, oceanY, this.viewWidth, oceanHeight);
        bg.endFill();

        bg.beginFill(0x6BB3E0);
        for (let i = 0; i < this.viewWidth; i += 40) {
            bg.drawRect(i, oceanY + 5, 20, 4);
            bg.drawRect(i + 10, oceanY + 25, 25, 4);
        }
        bg.endFill();

        const sandY = oceanY + oceanHeight;
        const sandHeight = this.viewHeight - sandY;
        bg.beginFill(0xF4D35E);
        bg.drawRect(0, sandY, this.viewWidth, sandHeight);
        bg.endFill();

        bg.beginFill(0xE8C54A);
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * this.viewWidth;
            const y = sandY + Math.random() * sandHeight;
            bg.drawRect(Math.floor(x), Math.floor(y), 2, 2);
        }
        bg.endFill();

        this._drawPalmTree(bg, 80, sandY - 10);
        this._drawPalmTree(bg, this.viewWidth - 100, sandY - 15);

        this.container.addChild(bg);
    }

    _drawCloud(g, x, y, size) {
        g.drawRect(x, y, size, size * 0.4);
        g.drawRect(x + size * 0.15, y - size * 0.2, size * 0.5, size * 0.3);
        g.drawRect(x + size * 0.4, y - size * 0.15, size * 0.45, size * 0.35);
    }

    _drawPalmTree(g, x, y) {
        g.beginFill(0x8B4513);
        g.drawRect(x - 4, y - 60, 8, 60);
        g.endFill();

        g.beginFill(0x0A8754);
        g.drawRect(x - 25, y - 65, 50, 6);
        g.drawRect(x - 5, y - 80, 10, 20);
        g.drawRect(x - 20, y - 75, 40, 5);
        g.drawRect(x - 15, y - 60, 30, 5);
        g.endFill();

        g.beginFill(0x654321);
        g.drawRect(x - 8, y - 58, 5, 5);
        g.drawRect(x + 3, y - 56, 5, 5);
        g.endFill();
    }

    _setupUI() {
        this.startScreen = document.getElementById('start-screen');
        this.startBtn = document.getElementById('start-btn');
        this.diffHint = document.getElementById('diff-hint');

        const diffBtns = document.querySelectorAll('.diff-btn');
        diffBtns.forEach(btn => {
            this.difficultyBtns.push(btn);
            btn.addEventListener('click', () => {
                this._selectDifficulty(btn.dataset.difficulty);
            });
        });

        this.startBtn.addEventListener('click', () => {
            this._onStartGame();
        });

        this._selectDifficulty('normal');
    }

    _selectDifficulty(difficulty) {
        this.selectedDifficulty = difficulty;

        this.difficultyBtns.forEach(btn => {
            if (btn.dataset.difficulty === difficulty) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        const hints = {
            easy: '简单难度：在2小时内撑过100小时游戏时间',
            normal: '普通难度：在1.5小时内撑过100小时游戏时间',
            hard: '困难难度：在1小时内撑过100小时游戏时间'
        };
        if (this.diffHint) {
            this.diffHint.textContent = hints[difficulty] || hints.normal;
        }
    }

    _onStartGame() {
        gameManager.init(this.selectedDifficulty);
        this.changeScene('game');
    }

    _onEnter() {
        if (this.startScreen) {
            this.startScreen.classList.remove('hidden');
        }
    }

    _onExit() {
        if (this.startScreen) {
            this.startScreen.classList.add('hidden');
        }
    }

    _onUpdate(delta) {
    }
}

window.StartScene = StartScene;

})();
