/**
 * Tom孤岛生存 - 游戏入口
 * 负责初始化 PixiJS 应用、场景管理和游戏主循环
 */

(function() {

const game = {
    app: null,
    container: null,
    currentScene: null,
    scenes: {},
    viewWidth: 1024,
    viewHeight: 768,

    async init() {
        console.log('🏝️ 孤岛生存挑战 - 游戏初始化中...');

        this.container = document.getElementById('game-container');
        if (!this.container) {
            console.error('找不到游戏容器 #game-container');
            return;
        }

        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
        PIXI.settings.ROUND_PIXELS = true;

        this.app = new PIXI.Application({
            width: this.viewWidth,
            height: this.viewHeight,
            backgroundColor: 0x87ceeb,
            antialias: false,
            roundPixels: true,
            resolution: 1,
            autoDensity: false,
            resizeTo: this.container
        });

        this.container.appendChild(this.app.view);

        inputManager.init(this.app.view);

        this.scenes.start = new StartScene(this);
        this.scenes.game = new GameScene(this);
        this.scenes.end = new EndScene(this);

        this.app.ticker.add(this._update.bind(this));

        this.changeScene('start');

        console.log('✅ 游戏初始化完成！');
    },

    changeScene(sceneName) {
        const scene = this.scenes[sceneName];
        if (!scene) {
            console.error(`找不到场景: ${sceneName}`);
            return;
        }

        if (this.currentScene) {
            this.currentScene.exit();
            this.app.stage.removeChild(this.currentScene.container);
        }

        this.currentScene = scene;
        this.app.stage.addChild(scene.container);
        scene.enter();

        console.log(`🎬 切换到场景: ${sceneName}`);
    },

    _update(delta) {
        const dt = delta / 60;

        if (this.currentScene) {
            this.currentScene.update(dt);
        }

        inputManager.update();
    }
};

window.addEventListener('load', () => {
    game.init();
});

window.game = game;

})();
