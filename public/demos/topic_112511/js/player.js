// 像素风格主角
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 50;
    this.facing = 'down'; // up, down, left, right
    this.isMoving = false;
    this.animFrame = 0;
    this.animTimer = 0;
  }

  update(input, dt, bounds) {
    const move = input.getMovementVector();
    const facing = input.getFacingDirection();

    this.isMoving = move.dx !== 0 || move.dy !== 0;
    if (facing) this.facing = facing;

    if (this.isMoving) {
      const speed = GAME_CONFIG.playerSpeed;
      this.x += move.dx * speed;
      this.y += move.dy * speed;

      // 动画计时
      this.animTimer += dt;
      if (this.animTimer >= GAME_CONFIG.animFrameDuration) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 4;
      }
    } else {
      this.animFrame = 0;
      this.animTimer = 0;
    }

    // 边界限制
    this.x = Math.max(0, Math.min(bounds.width - this.width, this.x));
    this.y = Math.max(0, Math.min(bounds.height - this.height, this.y));
  }

  draw(ctx) {
    const c = GAME_CONFIG.colors;
    const px = Math.round(this.x);
    const py = Math.round(this.y);

    // 动画相位：0,1,2,3 -> 摆动角度
    const walkCycle = this.isMoving ? Math.sin(this.animFrame * Math.PI / 2) : 0;
    const armSwing = walkCycle * 5; // 手臂摆动幅度（像素）
    const legSwing = walkCycle * 5; // 腿部摆动幅度

    ctx.save();

    switch (this.facing) {
      case 'down':
        this._drawDown(ctx, px, py, c, armSwing, legSwing);
        break;
      case 'up':
        this._drawUp(ctx, px, py, c, armSwing, legSwing);
        break;
      case 'left':
        this._drawLeft(ctx, px, py, c, armSwing, legSwing);
        break;
      case 'right':
        this._drawRight(ctx, px, py, c, armSwing, legSwing);
        break;
    }

    ctx.restore();
  }

  // 面向下：看到正脸
  _drawDown(ctx, px, py, c, armSwing, legSwing) {
    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(px + 3, py + 45, 25, 8);

    // 左腿
    ctx.fillStyle = c.pants;
    ctx.fillRect(px + 3 + legSwing, py + 30, 8, 13);
    ctx.fillRect(px + 3 + legSwing, py + 43, 8, 5);
    // 右腿
    ctx.fillRect(px + 15 - legSwing, py + 30, 8, 13);
    ctx.fillRect(px + 15 - legSwing, py + 43, 8, 5);

    // 鞋子
    ctx.fillStyle = c.shoes;
    ctx.fillRect(px + 3 + legSwing, py + 48, 8, 3);
    ctx.fillRect(px + 15 - legSwing, py + 48, 8, 3);

    // 身体
    ctx.fillStyle = c.shirt;
    ctx.fillRect(px + 5, py + 18, 20, 15);
    ctx.fillStyle = c.shirtLight;
    ctx.fillRect(px + 8, py + 20, 15, 5);

    // 左臂
    ctx.fillStyle = c.shirt;
    ctx.fillRect(px - 3, py + 18 + armSwing, 8, 13);
    ctx.fillStyle = c.skin;
    ctx.fillRect(px - 3, py + 30 + armSwing, 8, 5);

    // 右臂
    ctx.fillStyle = c.shirt;
    ctx.fillRect(px + 25, py + 18 - armSwing, 8, 13);
    ctx.fillStyle = c.skin;
    ctx.fillRect(px + 25, py + 30 - armSwing, 8, 5);

    // 头
    ctx.fillStyle = c.skin;
    ctx.fillRect(px + 5, py + 3, 20, 15);

    // 头发
    ctx.fillStyle = c.hair;
    ctx.fillRect(px + 5, py, 20, 5);
    ctx.fillRect(px + 3, py + 3, 5, 8);
    ctx.fillRect(px + 23, py + 3, 5, 8);

    // 眼睛
    ctx.fillStyle = c.eye;
    ctx.fillRect(px + 8, py + 8, 5, 5);
    ctx.fillRect(px + 18, py + 8, 5, 5);
    // 眼白
    ctx.fillStyle = '#fff';
    ctx.fillRect(px + 10, py + 8, 3, 3);
    ctx.fillRect(px + 20, py + 8, 3, 3);

    // 嘴巴
    ctx.fillStyle = c.mouth;
    ctx.fillRect(px + 13, py + 13, 5, 3);

    // 腮红
    ctx.fillStyle = c.blush;
    ctx.fillRect(px + 8, py + 13, 3, 3);
    ctx.fillRect(px + 20, py + 13, 3, 3);
  }

  // 面向上：看到后脑勺
  _drawUp(ctx, px, py, c, armSwing, legSwing) {
    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(px + 3, py + 45, 25, 8);

    // 左腿
    ctx.fillStyle = c.pants;
    ctx.fillRect(px + 3 + legSwing, py + 30, 8, 13);
    ctx.fillRect(px + 3 + legSwing, py + 43, 8, 5);
    // 右腿
    ctx.fillRect(px + 15 - legSwing, py + 30, 8, 13);
    ctx.fillRect(px + 15 - legSwing, py + 43, 8, 5);

    // 鞋子
    ctx.fillStyle = c.shoes;
    ctx.fillRect(px + 3 + legSwing, py + 48, 8, 3);
    ctx.fillRect(px + 15 - legSwing, py + 48, 8, 3);

    // 身体
    ctx.fillStyle = c.shirt;
    ctx.fillRect(px + 5, py + 18, 20, 15);

    // 左臂
    ctx.fillStyle = c.shirt;
    ctx.fillRect(px - 3, py + 18 + armSwing, 8, 13);
    ctx.fillStyle = c.skin;
    ctx.fillRect(px - 3, py + 30 + armSwing, 8, 5);

    // 右臂
    ctx.fillStyle = c.shirt;
    ctx.fillRect(px + 25, py + 18 - armSwing, 8, 13);
    ctx.fillStyle = c.skin;
    ctx.fillRect(px + 25, py + 30 - armSwing, 8, 5);

    // 头（后脑勺）
    ctx.fillStyle = c.skin;
    ctx.fillRect(px + 5, py + 3, 20, 15);

    // 头发（覆盖大部分头部）
    ctx.fillStyle = c.hair;
    ctx.fillRect(px + 5, py, 20, 10);
    ctx.fillRect(px + 3, py + 3, 5, 10);
    ctx.fillRect(px + 23, py + 3, 5, 10);
    // 后脑勺头发细节
    ctx.fillRect(px + 8, py + 10, 15, 5);
  }

  // 面向左：看到左侧
  _drawLeft(ctx, px, py, c, armSwing, legSwing) {
    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(px + 3, py + 45, 25, 8);

    // 左腿（后侧）
    ctx.fillStyle = c.pantsLight;
    ctx.fillRect(px + 5, py + 30, 8, 13);
    ctx.fillRect(px + 5, py + 43, 8, 5);
    // 右腿（前侧）
    ctx.fillStyle = c.pants;
    ctx.fillRect(px + 10 + legSwing, py + 30, 8, 13);
    ctx.fillRect(px + 10 + legSwing, py + 43, 8, 5);

    // 鞋子
    ctx.fillStyle = c.shoes;
    ctx.fillRect(px + 5, py + 48, 8, 3);
    ctx.fillRect(px + 10 + legSwing, py + 48, 8, 3);

    // 身体（侧面较窄）
    ctx.fillStyle = c.shirt;
    ctx.fillRect(px + 8, py + 18, 13, 15);
    ctx.fillStyle = c.shirtLight;
    ctx.fillRect(px + 10, py + 20, 8, 5);

    // 左臂（后侧，摆动较小）
    ctx.fillStyle = c.shirt;
    ctx.fillRect(px + 3, py + 18 + armSwing * 0.5, 5, 13);
    ctx.fillStyle = c.skin;
    ctx.fillRect(px + 3, py + 30 + armSwing * 0.5, 5, 5);

    // 右臂（前侧，明显摆动）
    ctx.fillStyle = c.shirt;
    ctx.fillRect(px + 20, py + 18 - armSwing, 5, 13);
    ctx.fillStyle = c.skin;
    ctx.fillRect(px + 20, py + 30 - armSwing, 5, 5);

    // 头（侧面）
    ctx.fillStyle = c.skin;
    ctx.fillRect(px + 8, py + 3, 13, 15);

    // 头发
    ctx.fillStyle = c.hair;
    ctx.fillRect(px + 8, py, 13, 5);
    ctx.fillRect(px + 18, py + 3, 5, 10);
    ctx.fillRect(px + 8, py + 3, 5, 5);

    // 眼睛（左侧看到左眼）
    ctx.fillStyle = c.eye;
    ctx.fillRect(px + 10, py + 8, 5, 5);
    ctx.fillStyle = '#fff';
    ctx.fillRect(px + 13, py + 8, 3, 3);

    // 鼻子
    ctx.fillStyle = c.skinShadow;
    ctx.fillRect(px + 8, py + 10, 3, 3);

    // 嘴巴
    ctx.fillStyle = c.mouth;
    ctx.fillRect(px + 10, py + 13, 5, 3);
  }

  // 面向右：看到右侧
  _drawRight(ctx, px, py, c, armSwing, legSwing) {
    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(px + 3, py + 45, 25, 8);

    // 左腿（后侧）
    ctx.fillStyle = c.pantsLight;
    ctx.fillRect(px + 13, py + 30, 8, 13);
    ctx.fillRect(px + 13, py + 43, 8, 5);
    // 右腿（前侧）
    ctx.fillStyle = c.pants;
    ctx.fillRect(px + 8 - legSwing, py + 30, 8, 13);
    ctx.fillRect(px + 8 - legSwing, py + 43, 8, 5);

    // 鞋子
    ctx.fillStyle = c.shoes;
    ctx.fillRect(px + 13, py + 48, 8, 3);
    ctx.fillRect(px + 8 - legSwing, py + 48, 8, 3);

    // 身体
    ctx.fillStyle = c.shirt;
    ctx.fillRect(px + 8, py + 18, 13, 15);
    ctx.fillStyle = c.shirtLight;
    ctx.fillRect(px + 10, py + 20, 8, 5);

    // 左臂（前侧，明显摆动）
    ctx.fillStyle = c.shirt;
    ctx.fillRect(px + 3, py + 18 - armSwing, 5, 13);
    ctx.fillStyle = c.skin;
    ctx.fillRect(px + 3, py + 30 - armSwing, 5, 5);

    // 右臂（后侧，摆动较小）
    ctx.fillStyle = c.shirt;
    ctx.fillRect(px + 20, py + 18 + armSwing * 0.5, 5, 13);
    ctx.fillStyle = c.skin;
    ctx.fillRect(px + 20, py + 30 + armSwing * 0.5, 5, 5);

    // 头（侧面）
    ctx.fillStyle = c.skin;
    ctx.fillRect(px + 8, py + 3, 13, 15);

    // 头发
    ctx.fillStyle = c.hair;
    ctx.fillRect(px + 8, py, 13, 5);
    ctx.fillRect(px + 5, py + 3, 5, 10);
    ctx.fillRect(px + 15, py + 3, 5, 5);

    // 眼睛（右侧看到右眼）
    ctx.fillStyle = c.eye;
    ctx.fillRect(px + 13, py + 8, 5, 5);
    ctx.fillStyle = '#fff';
    ctx.fillRect(px + 13, py + 8, 3, 3);

    // 鼻子
    ctx.fillStyle = c.skinShadow;
    ctx.fillRect(px + 18, py + 10, 3, 3);

    // 嘴巴
    ctx.fillStyle = c.mouth;
    ctx.fillRect(px + 13, py + 13, 5, 3);
  }
}
