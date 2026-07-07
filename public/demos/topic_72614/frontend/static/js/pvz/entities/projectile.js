// projectile.js - PVZ投射物实体类

// 投射物类型常量
export const PROJECTILE_TYPES = {
  PEA: 'pea',
  ICE_PEA: 'ice_pea',
  FIRE_PEA: 'fire_pea',
  CATAPULT: 'catapult',
  SPECIAL: 'special'
};

const CELL_SIZE = 80;
const GRID_OFFSET_X = 80;
const GRID_OFFSET_Y = 100;

// 投射物类型配置
const PROJECTILE_CONFIG = {
  pea:        { speed: 300, arc: false, special: null,         color: 0x4CAF50 },
  ice_pea:    { speed: 300, arc: false, special: 'slow',       color: 0x81D4FA },
  fire_pea:   { speed: 300, arc: false, special: 'fire',      color: 0xFF5722 },
  metal_pea:  { speed: 300, arc: false, special: 'pierce',    color: 0x9E9E9E },
  spore:      { speed: 300, arc: false, special: null,         color: 0x7B1FA2 },
  fume:       { speed: 250, arc: false, special: 'pierce',    color: 0xCE93D8 },
  spike:      { speed: 350, arc: false, special: null,         color: 0x2E7D32 },
  star:       { speed: 250, arc: false, special: 'multi_dir', color: 0xFFD600 },
  cabbage:    { speed: 200, arc: true,  special: null,         color: 0x8BC34A },
  corn:       { speed: 200, arc: true,  special: null,         color: 0xFFEE58 },
  butter:     { speed: 200, arc: true,  special: 'stun',      color: 0xFFA726 },
  melon:      { speed: 200, arc: true,  special: 'splash',    color: 0x4CAF50 },
  ice_melon:  { speed: 200, arc: true,  special: 'splash_slow', color: 0x81D4FA },
  cob:        { speed: 250, arc: true,  special: 'big_splash', color: 0xFFEE58 },
  cattail:    { speed: 300, arc: false, special: 'homing',    color: 0xFF6F00 }
};

const SPLASH_RADIUS = CELL_SIZE * 1.5; // 溅射范围
const HIT_RADIUS = 20; // 碰撞检测半径

export class Projectile {
  constructor(type, x, y, row, damage, specialParams = null) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.row = row;
    this.damage = damage;
    this.alive = true;
    this.sprite = null;

    // 从配置获取属性
    const config = PROJECTILE_CONFIG[type] || PROJECTILE_CONFIG.pea;
    this.speed = config.speed;
    this.isArc = config.arc;
    this.special = config.special;
    this.color = config.color;

    // 直线投射物方向
    this.directionX = 1; // 默认向右
    this.directionY = 0;

    // 星形投射物角度
    if (type === 'star' && specialParams && typeof specialParams === 'number') {
      this.angle = specialParams;
      this.directionX = Math.cos(this.angle);
      this.directionY = Math.sin(this.angle);
    }

    // 抛物线投射物
    this.targetX = 0;
    this.arcHeight = 120;
    this.arcProgress = 0;
    this.startX = x;
    this.startY = y;
    this.totalDistance = 0;

    if (this.isArc && specialParams) {
      if (typeof specialParams === 'object') {
        this.targetX = specialParams.targetX || x + 400;
        this.arcHeight = specialParams.arcHeight || 120;
      }
      this.totalDistance = Math.abs(this.targetX - this.startX);
    }

    // 追踪投射物
    this.targetZombie = null;
    if (type === 'cattail' && specialParams) {
      this.targetZombie = specialParams;
    }

    // 穿透计数
    this.pierceCount = this.special === 'pierce' ? 3 : 1;

    // 火豌豆是否由火炬增强
    this.isFireBoosted = false;

    // 烟雾穿透标记
    this.isFume = type === 'fume';

    // 伤害已造成的僵尸集合（防止同一帧多次命中）
    this.hitZombieIds = new Set();
  }

  update(deltaTime, zombies) {
    if (!this.alive) return;

    if (this.isArc) {
      this._updateArc(deltaTime, zombies);
    } else if (this.special === 'homing') {
      this._updateHoming(deltaTime, zombies);
    } else {
      this._updateStraight(deltaTime, zombies);
    }

    // 超出屏幕边界销毁
    if (this.x > 9 * CELL_SIZE + GRID_OFFSET_X + 100 ||
        this.x < GRID_OFFSET_X - 100 ||
        this.y > 5 * CELL_SIZE + GRID_OFFSET_Y + 100 ||
        this.y < GRID_OFFSET_Y - 100) {
      this.destroy();
    }
  }

  _updateStraight(deltaTime, zombies) {
    const moveX = this.directionX * this.speed * deltaTime;
    const moveY = this.directionY * this.speed * deltaTime;
    this.x += moveX;
    this.y += moveY;

    // 碰撞检测
    this._checkCollision(zombies);
  }

  _updateArc(deltaTime, zombies) {
    // 抛物线运动
    const moveAmount = this.speed * deltaTime;
    this.arcProgress += moveAmount / this.totalDistance;

    if (this.arcProgress >= 1) {
      // 到达目标
      this.x = this.targetX;
      this._onArcLand(zombies);
      this.destroy();
      return;
    }

    // 插值位置
    this.x = this.startX + (this.targetX - this.startX) * this.arcProgress;
    // 抛物线高度: y = -4h * t * (t - 1)
    const arcOffset = -4 * this.arcHeight * this.arcProgress * (this.arcProgress - 1);
    this.y = this.startY - arcOffset;

    // 抛物线投射物在飞行中不检测碰撞（除了烟雾穿透类）
  }

  _updateHoming(deltaTime, zombies) {
    // 追踪最近僵尸
    if (this.targetZombie && (this.targetZombie.state === 'dead' || this.targetZombie.state === 'dying')) {
      this.targetZombie = null;
    }

    if (!this.targetZombie) {
      // 找新的目标
      let minDist = Infinity;
      for (const z of zombies) {
        if (z.state === 'dead' || z.state === 'dying') continue;
        const dist = Math.hypot(z.x - this.x, z.y - this.y);
        if (dist < minDist) {
          minDist = dist;
          this.targetZombie = z;
        }
      }
    }

    if (this.targetZombie) {
      const dx = this.targetZombie.x - this.x;
      const dy = this.targetZombie.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0) {
        this.directionX = dx / dist;
        this.directionY = dy / dist;
      }
    }

    const moveX = this.directionX * this.speed * deltaTime;
    const moveY = this.directionY * this.speed * deltaTime;
    this.x += moveX;
    this.y += moveY;

    this._checkCollision(zombies);
  }

  _checkCollision(zombies) {
    for (const zombie of zombies) {
      if (zombie.state === 'dead' || zombie.state === 'dying') continue;
      if (this.hitZombieIds.has(zombie._id || id(zombie))) continue;

      // 气球僵尸在空中时只有特定投射物能命中
      if (zombie.isFlying && this.type !== 'spike' && this.type !== 'cattail' && this.type !== 'star') {
        continue;
      }

      // 潜水僵尸在水下时无法被普通投射物命中
      if (zombie.isUnderwater && this.type !== 'fume') {
        continue;
      }

      const dist = Math.hypot(zombie.x - this.x, zombie.y - this.y);
      if (dist < HIT_RADIUS + 20) {
        this.hitZombie(zombie);

        if (this.pierceCount > 1) {
          this.pierceCount--;
          this.hitZombieIds.add(zombie._id || id(zombie));
        } else if (this.special === 'pierce') {
          // 烟雾穿透继续飞行
          this.hitZombieIds.add(zombie._id || id(zombie));
        } else {
          this.destroy();
          return;
        }
      }
    }
  }

  _onArcLand(zombies) {
    // 抛物线落地时检测碰撞
    const hitZombie = zombies.find(z => {
      if (z.state === 'dead' || z.state === 'dying') return false;
      const dist = Math.hypot(z.x - this.x, z.y - this.y);
      return dist < CELL_SIZE;
    });

    if (hitZombie) {
      this.hitZombie(hitZombie);
    }

    // 溅射伤害
    if (this.special === 'splash' || this.special === 'splash_slow' || this.special === 'big_splash') {
      const splashRadius = this.special === 'big_splash' ? SPLASH_RADIUS * 2 : SPLASH_RADIUS;
      const splashDamage = this.special === 'big_splash' ? this.damage : Math.floor(this.damage * 0.5);

      zombies.forEach(z => {
        if (z.state === 'dead' || z.state === 'dying') return;
        if (z === hitZombie) return;
        const dist = Math.hypot(z.x - this.x, z.y - this.y);
        if (dist < splashRadius) {
          z.takeDamage(splashDamage);
          if (this.special === 'splash_slow') {
            z.applySlow(0.5, 3);
          }
        }
      });
    }
  }

  hitZombie(zombie) {
    let damage = this.damage;

    // 火豌豆伤害翻倍
    if (this.type === 'fire_pea' || this.isFireBoosted) {
      damage *= 2;
    }

    // 应用伤害
    zombie.takeDamage(damage);

    // 应用特殊效果
    switch (this.special) {
      case 'slow':
        zombie.applySlow(0.5, 3);
        break;
      case 'stun':
        zombie.applyStun(2);
        break;
      case 'splash_slow':
        zombie.applySlow(0.5, 3);
        break;
      case 'fire':
        // 火焰解除冰冻
        if (zombie.isFrozen) {
          zombie.isFrozen = false;
        }
        if (zombie.isSlowed) {
          zombie.isSlowed = false;
        }
        break;
    }

    // 冰豌豆减速
    if (this.effect === 'slow') {
      zombie.applySlow(0.5, 3);
    }

    // 黄油眩晕
    if (this.effect === 'stun') {
      zombie.applyStun(2);
    }
  }

  applyTorchBoost() {
    if (this.type === 'pea') {
      this.type = 'fire_pea';
      this.special = 'fire';
      this.color = 0xFF5722;
      this.isFireBoosted = true;
    } else if (this.type === 'ice_pea') {
      // 冰豌豆经过火炬变成普通豌豆（冰火抵消）
      this.type = 'pea';
      this.special = null;
      this.color = 0x4CAF50;
    }
  }

  destroy() {
    this.alive = false;
    this.sprite = null;
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }

  serialize() {
    return {
      type: this.type,
      x: this.x,
      y: this.y,
      row: this.row,
      damage: this.damage,
      special: this.special,
      directionX: this.directionX,
      directionY: this.directionY,
      isArc: this.isArc,
      arcProgress: this.arcProgress,
      startX: this.startX,
      startY: this.startY,
      targetX: this.targetX,
      arcHeight: this.arcHeight,
      totalDistance: this.totalDistance,
      pierceCount: this.pierceCount,
      isFireBoosted: this.isFireBoosted,
      alive: this.alive
    };
  }

  static deserialize(data) {
    const projectile = new Projectile(data.type, data.x, data.y, data.row, data.damage);
    projectile.special = data.special;
    projectile.directionX = data.directionX;
    projectile.directionY = data.directionY;
    projectile.isArc = data.isArc;
    projectile.arcProgress = data.arcProgress;
    projectile.startX = data.startX;
    projectile.startY = data.startY;
    projectile.targetX = data.targetX;
    projectile.arcHeight = data.arcHeight;
    projectile.totalDistance = data.totalDistance;
    projectile.pierceCount = data.pierceCount;
    projectile.isFireBoosted = data.isFireBoosted;
    projectile.alive = data.alive;
    return projectile;
  }
}

// 简单ID生成辅助
let _nextId = 1;
function id(obj) {
  if (!obj._id) obj._id = _nextId++;
  return obj._id;
}
