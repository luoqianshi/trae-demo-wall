// ===================================================================
// input.js - 键盘输入控制器
// 方向键控制移动，空格暂停，回车/右键进入下一关
// ===================================================================

export class Input {
    constructor() {
        this.keys = new Set();
        this.justPressed = new Set();
        this.justClicked = false;
        this._bind();
    }

    _bind() {
        window.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
            if (!this.keys.has(e.code)) {
                this.justPressed.add(e.code);
            }
            this.keys.add(e.code);
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
        });

        window.addEventListener('blur', () => {
            this.keys.clear();
        });

        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        window.addEventListener('click', (e) => {
            if (e.button === 0) {
                this.justClicked = true;
            }
        });
    }

    get up()    { return this.keys.has('ArrowUp'); }
    get down()  { return this.keys.has('ArrowDown'); }
    get left()  { return this.keys.has('ArrowLeft'); }
    get right() { return this.keys.has('ArrowRight'); }

    consumePause() {
        if (this.justPressed.has('Space')) {
            this.justPressed.delete('Space');
            return true;
        }
        return false;
    }

    consumeConfirm() {
        const ok = this.justClicked;
        if (ok) this.justClicked = false;
        return ok;
    }

    endFrame() {
        this.justPressed.clear();
        // 不在这里清空 justClicked，只在被消费时清空
    }
}
