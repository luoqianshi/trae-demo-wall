export class Camera {
  x: number = 0;
  y: number = 0;
  width: number;
  height: number;
  private levelWidth: number;
  private levelHeight: number;

  constructor(width: number, height: number, levelWidth: number, levelHeight: number) {
    this.width = width;
    this.height = height;
    this.levelWidth = levelWidth;
    this.levelHeight = levelHeight;
  }

  follow(targetX: number, targetY: number) {
    // 水平跟随 - 将目标保持在屏幕左1/3处
    const targetCamX = targetX - this.width / 3;
    this.x += (targetCamX - this.x) * 0.1; // 平滑插值

    // 限制摄像机不超出关卡边界
    this.x = Math.max(0, Math.min(this.x, this.levelWidth - this.width));

    // 垂直 - 固定在底部
    this.y = this.levelHeight - this.height;
  }

  isVisible(x: number, y: number, w: number, h: number): boolean {
    return x + w > this.x && x < this.x + this.width &&
           y + h > this.y && y < this.y + this.height;
  }
}
