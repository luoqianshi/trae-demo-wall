/**
 * Tom孤岛生存 - 输入管理器
 * 负责管理键盘和鼠标输入，提供统一的输入查询接口
 */

(function() {

class InputManager {
    constructor() {
        this._keys = {};
        this._prevKeys = {};

        this._mouse = {
            x: 0,
            y: 0,
            worldX: 0,
            worldY: 0,
            isDown: false,
            isJustPressed: false,
            isJustReleased: false
        };

        this._clickTarget = null;

        this._eventListeners = {
            keydown: [],
            keyup: [],
            mousedown: [],
            mouseup: [],
            mousemove: []
        };

        this._initialized = false;
    }

    init(target = window) {
        if (this._initialized) return;

        this._target = target;

        this._onKeyDown = (e) => this._handleKeyDown(e);
        this._onKeyUp = (e) => this._handleKeyUp(e);
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);

        this._onMouseDown = (e) => this._handleMouseDown(e);
        this._onMouseUp = (e) => this._handleMouseUp(e);
        this._onMouseMove = (e) => this._handleMouseMove(e);
        target.addEventListener('mousedown', this._onMouseDown);
        target.addEventListener('mouseup', this._onMouseUp);
        target.addEventListener('mousemove', this._onMouseMove);

        this._onContextMenu = (e) => e.preventDefault();
        target.addEventListener('contextmenu', this._onContextMenu);

        this._initialized = true;
    }

    destroy() {
        if (!this._initialized) return;

        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);

        if (this._target) {
            this._target.removeEventListener('mousedown', this._onMouseDown);
            this._target.removeEventListener('mouseup', this._onMouseUp);
            this._target.removeEventListener('mousemove', this._onMouseMove);
            this._target.removeEventListener('contextmenu', this._onContextMenu);
        }

        this._initialized = false;
    }

    update() {
        this._prevKeys = { ...this._keys };
        this._mouse.isJustPressed = false;
        this._mouse.isJustReleased = false;
    }

    isKeyDown(code) {
        return !!this._keys[code];
    }

    isKeyJustPressed(code) {
        return this._keys[code] && !this._prevKeys[code];
    }

    isKeyJustReleased(code) {
        return !this._keys[code] && this._prevKeys[code];
    }

    isAnyKeyDown() {
        return Object.values(this._keys).some(v => v);
    }

    getHorizontalAxis() {
        let value = 0;
        if (this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft')) value -= 1;
        if (this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) value += 1;
        return value;
    }

    getVerticalAxis() {
        let value = 0;
        if (this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp')) value -= 1;
        if (this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown')) value += 1;
        return value;
    }

    getMoveDirection() {
        const x = this.getHorizontalAxis();
        const y = this.getVerticalAxis();
        const len = Math.sqrt(x * x + y * y);
        if (len > 0) {
            return { x: x / len, y: y / len };
        }
        return { x: 0, y: 0 };
    }

    getMousePosition() {
        return { x: this._mouse.x, y: this._mouse.y };
    }

    getMouseWorldPosition() {
        return { x: this._mouse.worldX, y: this._mouse.worldY };
    }

    setMouseWorldPosition(x, y) {
        this._mouse.worldX = x;
        this._mouse.worldY = y;
    }

    isMouseDown() {
        return this._mouse.isDown;
    }

    isMouseJustPressed() {
        return this._mouse.isJustPressed;
    }

    isMouseJustReleased() {
        return this._mouse.isJustReleased;
    }

    isInteractPressed() {
        return this.isKeyJustPressed('KeyE') || this.isKeyJustPressed('Space');
    }

    setClickTarget(worldX, worldY) {
        this._clickTarget = { x: worldX, y: worldY };
    }

    getClickTarget() {
        return this._clickTarget;
    }

    clearClickTarget() {
        this._clickTarget = null;
    }

    on(eventName, callback) {
        if (this._eventListeners[eventName]) {
            this._eventListeners[eventName].push(callback);
        }
    }

    off(eventName, callback) {
        const listeners = this._eventListeners[eventName];
        if (!listeners) return;
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    _handleKeyDown(e) {
        if (this._keys[e.code]) return;
        this._keys[e.code] = true;
        this._emit('keydown', e);
    }

    _handleKeyUp(e) {
        this._keys[e.code] = false;
        this._emit('keyup', e);
    }

    _handleMouseDown(e) {
        if (e.button !== 0) return;
        this._mouse.isDown = true;
        this._mouse.isJustPressed = true;
        this._updateMousePosition(e);
        this._emit('mousedown', { ...this._mouse });
    }

    _handleMouseUp(e) {
        if (e.button !== 0) return;
        this._mouse.isDown = false;
        this._mouse.isJustReleased = true;
        this._updateMousePosition(e);
        this._emit('mouseup', { ...this._mouse });
    }

    _handleMouseMove(e) {
        this._updateMousePosition(e);
        this._emit('mousemove', { ...this._mouse });
    }

    _updateMousePosition(e) {
        if (this._target && this._target.getBoundingClientRect) {
            const rect = this._target.getBoundingClientRect();
            this._mouse.x = e.clientX - rect.left;
            this._mouse.y = e.clientY - rect.top;
        } else {
            this._mouse.x = e.clientX;
            this._mouse.y = e.clientY;
        }
    }

    _emit(eventName, data) {
        const listeners = this._eventListeners[eventName];
        if (!listeners) return;
        listeners.forEach(callback => {
            try {
                callback(data);
            } catch (e) {
                console.error(`InputManager 事件回调错误 [${eventName}]:`, e);
            }
        });
    }
}

window.inputManager = new InputManager();

})();
