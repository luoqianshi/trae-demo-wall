// 键盘输入处理
class InputHandler {
  constructor() {
    this.keys = {};
    this.keysPressed = {};
    this.keysReleased = {};

    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (!this.keys[key]) {
        this.keysPressed[key] = true;
      }
      this.keys[key] = true;

      // 阻止方向键和空格滚动页面
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      this.keys[key] = false;
      this.keysReleased[key] = true;
    });
  }

  // 检查按键是否按住
  isDown(key) {
    return !!this.keys[key.toLowerCase()];
  }

  // 检查按键是否刚按下（本帧内）
  isPressed(key) {
    return !!this.keysPressed[key.toLowerCase()];
  }

  // 检查按键是否刚释放
  isReleased(key) {
    return !!this.keysReleased[key.toLowerCase()];
  }

  // 获取移动方向向量
  getMovementVector() {
    let dx = 0;
    let dy = 0;

    if (this.isDown('w') || this.isDown('arrowup')) dy -= 1;
    if (this.isDown('s') || this.isDown('arrowdown')) dy += 1;
    if (this.isDown('a') || this.isDown('arrowleft')) dx -= 1;
    if (this.isDown('d') || this.isDown('arrowright')) dx += 1;

    // 归一化对角线移动
    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
    }

    return { dx, dy };
  }

  // 获取面向方向（用于面部朝向）
  getFacingDirection() {
    if (this.isDown('w') || this.isDown('arrowup')) return 'up';
    if (this.isDown('s') || this.isDown('arrowdown')) return 'down';
    if (this.isDown('a') || this.isDown('arrowleft')) return 'left';
    if (this.isDown('d') || this.isDown('arrowright')) return 'right';
    return null;
  }

  // 每帧结束后清理按/放状态
  update() {
    this.keysPressed = {};
    this.keysReleased = {};
  }
}
