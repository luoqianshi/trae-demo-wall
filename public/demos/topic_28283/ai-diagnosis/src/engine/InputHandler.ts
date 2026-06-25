export class InputHandler {
  private keys: Map<string, boolean> = new Map();
  private justPressed: Map<string, boolean> = new Map();
  private touchControls: { left: boolean; right: boolean; jump: boolean; run: boolean; down: boolean } = {
    left: false, right: false, jump: false, run: false, down: false,
  };

  constructor() {
    this.setupKeyboardListeners();
  }

  private setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      if (!this.keys.get(e.code)) {
        this.justPressed.set(e.code, true);
      }
      this.keys.set(e.code, true);
      // 阻止方向键和空格的默认行为
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.set(e.code, false);
    });
  }

  isLeft(): boolean {
    return this.keys.get('ArrowLeft') || this.keys.get('KeyA') || this.touchControls.left || false;
  }

  isRight(): boolean {
    return this.keys.get('ArrowRight') || this.keys.get('KeyD') || this.touchControls.right || false;
  }

  isJump(): boolean {
    return this.keys.get('Space') || this.keys.get('ArrowUp') || this.keys.get('KeyW') || this.touchControls.jump || false;
  }

  isRun(): boolean {
    return this.keys.get('ShiftLeft') || this.keys.get('ShiftRight') || this.touchControls.run || false;
  }

  isDown(): boolean {
    return this.keys.get('ArrowDown') || this.keys.get('KeyS') || this.touchControls.down || false;
  }

  isPause(): boolean {
    return this.justPressed.get('Escape') || this.justPressed.get('KeyP') || false;
  }

  setTouchControl(control: 'left' | 'right' | 'jump' | 'run' | 'down', value: boolean) {
    this.touchControls[control] = value;
  }

  update() {
    this.justPressed.clear();
  }

  destroy() {
    // 清理工作在这里，但由于事件监听器是匿名函数，实际不需要
  }
}
