// sunlight.js - PVZ阳光实体类

const FALL_SPEED = 60; // 阳光下落速度（像素/秒）
const LIFETIME = 8; // 阳光存在时间（秒）
const CLICK_RADIUS = 30; // 点击检测半径

export class Sunlight {
  constructor(x, y, amount, source) {
    this.x = x;
    this.y = y;
    this.amount = amount; // 25 或 50
    this.source = source; // 'sky' 或 'plant'
    this.alive = true;
    this.collected = false;

    // 下落状态
    this.falling = source === 'sky';
    this.targetY = source === 'sky'
      ? 200 + Math.random() * 200  // 天空阳光落到的目标Y (200-400)
      : y;                          // 植物阳光原地停留

    // 生命周期
    this.lifetime = LIFETIME;
    this.maxLifetime = LIFETIME;

    // 动画
    this.sprite = null;
    this.opacity = 1;
    this.scale = 1;
    this.pulseTimer = 0;

    // 收集动画
    this.isCollecting = false;
    this.collectTargetX = 0;
    this.collectTargetY = 0;
    this.collectSpeed = 500; // 收集飞行速度
  }

  update(deltaTime) {
    if (!this.alive) return;

    // 收集动画
    if (this.isCollecting) {
      this._updateCollectAnimation(deltaTime);
      return;
    }

    // 下落
    if (this.falling) {
      this.y += FALL_SPEED * deltaTime;
      if (this.y >= this.targetY) {
        this.y = this.targetY;
        this.falling = false;
      }
    }

    // 生命周期递减
    this.lifetime -= deltaTime;

    // 脉冲动画
    this.pulseTimer += deltaTime;
    this.scale = 1 + Math.sin(this.pulseTimer * 3) * 0.05;

    // 快消失时闪烁
    if (this.lifetime <= 2) {
      this.opacity = 0.3 + Math.sin(this.pulseTimer * 8) * 0.3 + 0.3;
    }

    // 消失
    if (this.lifetime <= 0) {
      this.alive = false;
    }
  }

  _updateCollectAnimation(deltaTime) {
    const dx = this.collectTargetX - this.x;
    const dy = this.collectTargetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 10) {
      this.alive = false;
      this.collected = true;
      return;
    }

    const moveAmount = this.collectSpeed * deltaTime;
    const ratio = Math.min(moveAmount / dist, 1);
    this.x += dx * ratio;
    this.y += dy * ratio;

    // 收集时缩小
    this.scale = Math.max(0.1, this.scale - deltaTime * 2);
  }

  collect(targetX, targetY) {
    if (this.collected || this.isCollecting) return 0;

    this.isCollecting = true;
    this.collectTargetX = targetX || 0;
    this.collectTargetY = targetY || 0;

    return this.amount;
  }

  isClicked(clickX, clickY) {
    if (this.collected || this.isCollecting || !this.alive) return false;

    const dist = Math.hypot(clickX - this.x, clickY - this.y);
    return dist <= CLICK_RADIUS;
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }

  serialize() {
    return {
      x: this.x,
      y: this.y,
      amount: this.amount,
      source: this.source,
      alive: this.alive,
      collected: this.collected,
      falling: this.falling,
      targetY: this.targetY,
      lifetime: this.lifetime,
      isCollecting: this.isCollecting,
      collectTargetX: this.collectTargetX,
      collectTargetY: this.collectTargetY
    };
  }

  static deserialize(data) {
    const sunlight = new Sunlight(data.x, data.y, data.amount, data.source);
    sunlight.alive = data.alive;
    sunlight.collected = data.collected;
    sunlight.falling = data.falling;
    sunlight.targetY = data.targetY;
    sunlight.lifetime = data.lifetime;
    sunlight.isCollecting = data.isCollecting;
    sunlight.collectTargetX = data.collectTargetX;
    sunlight.collectTargetY = data.collectTargetY;
    return sunlight;
  }
}
