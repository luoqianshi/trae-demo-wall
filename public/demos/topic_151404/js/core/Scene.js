/**
 * 场景基类
 * 所有游戏场景的父类，提供统一的生命周期管理和基础功能
 * 子类需要实现 enter()、exit()、update() 等方法
 */

(function() {

class Scene {
    constructor(game) {
        this.game = game;
        this.container = new PIXI.Container();
        this.initialized = false;
        this.active = false;
    }

    enter() {
        this.active = true;
        if (!this.initialized) {
            this._init();
            this.initialized = true;
        }
        this._onEnter();
    }

    exit() {
        this.active = false;
        this._onExit();
    }

    update(delta) {
        if (!this.active) return;
        this._onUpdate(delta);
    }

    _init() {
    }

    _onEnter() {
    }

    _onExit() {
    }

    _onUpdate(delta) {
    }

    changeScene(sceneName) {
        if (this.game) {
            this.game.changeScene(sceneName);
        }
    }

    get app() {
        return this.game ? this.game.app : null;
    }

    get viewWidth() {
        return this.app ? this.app.screen.width : 800;
    }

    get viewHeight() {
        return this.app ? this.app.screen.height : 600;
    }
}

window.Scene = Scene;

})();
