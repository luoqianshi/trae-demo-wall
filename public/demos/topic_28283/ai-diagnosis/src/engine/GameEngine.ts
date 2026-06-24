import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, GRAVITY, MAX_FALL_SPEED, JUMP_FORCE, PLAYER_SPEED, PLAYER_RUN_SPEED, FRICTION, GROUND_FRICTION, TILE, GAME_STATE, PLAYER_STATE, DIRECTION, COLORS } from './Constants';
import { InputHandler } from './InputHandler';
import { AudioManager } from './AudioManager';
import { Camera } from './Camera';
import { ParticleSystem } from './ParticleSystem';
import { SpriteRenderer } from './SpriteRenderer';

// 实体接口
interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  active: boolean;
}

interface Enemy extends Entity {
  type: 'goomba' | 'koopa';
  direction: number;
  alive: boolean;
  squished: boolean;
  squishTimer: number;
  shell?: boolean;
  shellMoving?: boolean;
}

interface CoinEntity extends Entity {
  collected: boolean;
  animFrame: number;
}

interface PowerUpEntity extends Entity {
  type: 'mushroom' | 'star' | 'fireflower';
  emerging: boolean;
  emergeY: number;
  active: boolean;
}

interface BlockEntity {
  x: number;
  y: number;
  type: number;
  hit: boolean;
  content?: 'coin' | 'mushroom' | 'star' | 'fireflower' | 'coins';
  coinsLeft: number;
  bounceOffset: number;
}

export class GameEngine {
  // 画布
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  // 系统
  input: InputHandler;
  audio: AudioManager;
  camera: Camera;
  particles: ParticleSystem;

  // 游戏状态
  gameState: string = GAME_STATE.MENU;
  score: number = 0;
  coins: number = 0;
  lives: number = 3;
  time: number = 400;
  timeCounter: number = 0;
  currentLevel: number = 0;
  animFrame: number = 0;

  // 玩家
  player: {
    x: number;
    y: number;
    width: number;
    height: number;
    vx: number;
    vy: number;
    state: string;
    direction: number;
    onGround: boolean;
    jumping: boolean;
    running: boolean;
    invincible: number;
    invincibleStar: number;
    dead: boolean;
    deathTimer: number;
    frame: number;
    frameTimer: number;
    sliding: boolean;
  };

  // 关卡数据
  levelData: number[][] = [];
  levelWidth: number = 0;
  levelHeight: number = 0;

  // 实体
  enemies: Enemy[] = [];
  coinEntities: CoinEntity[] = [];
  powerUps: PowerUpEntity[] = [];
  blocks: BlockEntity[] = [];

  // 背景元素
  clouds: { x: number; y: number; size: number }[] = [];
  hills: { x: number; y: number; size: number }[] = [];
  bushes: { x: number; y: number; size: number }[] = [];

  // 旗帜
  flagReached: boolean = false;
  flagY: number = 0;
  flagSliding: boolean = false;
  levelCompleteTimer: number = 0;

  // 回调
  onStateChange?: (state: string) => void;
  onScoreChange?: (score: number, coins: number, lives: number, time: number, level: string) => void;

  private animationId: number = 0;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private readonly FRAME_TIME = 1000 / 60;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;

    this.input = new InputHandler();
    this.audio = new AudioManager();
    this.camera = new Camera(CANVAS_WIDTH, CANVAS_HEIGHT, 0, 0);
    this.particles = new ParticleSystem();

    this.player = this.createDefaultPlayer();
  }

  private createDefaultPlayer() {
    return {
      x: 64,
      y: 0,
      width: 24,
      height: 28,
      vx: 0,
      vy: 0,
      state: PLAYER_STATE.SMALL,
      direction: DIRECTION.RIGHT,
      onGround: false,
      jumping: false,
      running: false,
      invincible: 0,
      invincibleStar: 0,
      dead: false,
      deathTimer: 0,
      frame: 0,
      frameTimer: 0,
      sliding: false,
    };
  }

  // 加载关卡
  loadLevel(levelIndex: number) {
    const levels = [getLevel1Data(), getLevel2Data(), getLevel3Data()];
    const level = levels[levelIndex % levels.length];

    this.levelData = level.tiles;
    this.levelHeight = this.levelData.length * TILE_SIZE;
    this.levelWidth = this.levelData[0].length * TILE_SIZE;

    this.camera = new Camera(CANVAS_WIDTH, CANVAS_HEIGHT, this.levelWidth, this.levelHeight);

    // 解析实体
    this.enemies = [];
    this.coinEntities = [];
    this.powerUps = [];
    this.blocks = [];
    this.clouds = [];
    this.hills = [];
    this.bushes = [];

    // 从地图数据中提取方块
    for (let row = 0; row < this.levelData.length; row++) {
      for (let col = 0; col < this.levelData[row].length; col++) {
        const tile = this.levelData[row][col];
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;

        if (tile === TILE.QUESTION_BLOCK) {
          this.blocks.push({
            x, y, type: tile, hit: false,
            content: (col * row) % 5 === 0 ? 'mushroom' : 'coin',
            coinsLeft: 1, bounceOffset: 0,
          });
        } else if (tile === TILE.BRICK) {
          this.blocks.push({
            x, y, type: tile, hit: false,
            content: undefined, coinsLeft: 0, bounceOffset: 0,
          });
        }
      }
    }

    // 加载敌人
    level.enemies.forEach(e => {
      this.enemies.push({
        x: e.x, y: e.y,
        width: 28, height: 28,
        vx: -1, vy: 0,
        active: true, alive: true,
        type: e.type, direction: -1,
        squished: false, squishTimer: 0,
        shell: false, shellMoving: false,
      });
    });

    // 加载金币
    level.coins.forEach(c => {
      this.coinEntities.push({
        x: c.x, y: c.y,
        width: 16, height: 24,
        vx: 0, vy: 0,
        active: true, collected: false,
        animFrame: Math.random() * 100,
      });
    });

    // 生成背景元素
    for (let i = 0; i < this.levelWidth / 200; i++) {
      this.clouds.push({
        x: i * 200 + Math.random() * 100,
        y: 30 + Math.random() * 60,
        size: 0.6 + Math.random() * 0.6,
      });
      this.hills.push({
        x: i * 300 + Math.random() * 100,
        y: this.levelHeight - TILE_SIZE,
        size: 0.8 + Math.random() * 0.8,
      });
      if (Math.random() > 0.5) {
        this.bushes.push({
          x: i * 250 + Math.random() * 150,
          y: this.levelHeight - TILE_SIZE - 4,
          size: 0.5 + Math.random() * 0.5,
        });
      }
    }

    // 重置玩家
    this.player = this.createDefaultPlayer();
    this.player.x = level.playerStart.x;
    this.player.y = level.playerStart.y;
    this.placePlayerOnGround();

    this.flagReached = false;
    this.flagY = 0;
    this.flagSliding = false;
    this.levelCompleteTimer = 0;
    this.time = 400;
    this.timeCounter = 0;
    this.currentLevel = levelIndex;
    this.animFrame = 0;
  }

  private placePlayerOnGround() {
    // 找到玩家脚下最近的地面
    const col = Math.floor(this.player.x / TILE_SIZE);
    for (let row = 0; row < this.levelData.length; row++) {
      if (this.isSolidTile(col, row)) {
        this.player.y = row * TILE_SIZE - this.player.height;
        this.player.onGround = true;
        return;
      }
    }
  }

  // 开始游戏
  startGame() {
    this.audio.init();
    this.audio.resume();
    this.score = 0;
    this.coins = 0;
    this.lives = 3;
    this.currentLevel = 0;
    this.loadLevel(0);
    this.gameState = GAME_STATE.PLAYING;
    this.onStateChange?.(this.gameState);
    this.audio.startBGM();
    this.startLoop();
  }

  // 继续游戏（死亡后重生）
  respawn() {
    this.loadLevel(this.currentLevel);
    this.gameState = GAME_STATE.PLAYING;
    this.onStateChange?.(this.gameState);
    this.audio.startBGM();
    this.startLoop();
  }

  // 下一关
  nextLevel() {
    this.loadLevel(this.currentLevel + 1);
    this.gameState = GAME_STATE.PLAYING;
    this.onStateChange?.(this.gameState);
    this.audio.startBGM();
  }

  // 暂停
  togglePause() {
    if (this.gameState === GAME_STATE.PLAYING) {
      this.gameState = GAME_STATE.PAUSED;
      this.audio.stopBGM();
    } else if (this.gameState === GAME_STATE.PAUSED) {
      this.gameState = GAME_STATE.PLAYING;
      this.audio.startBGM();
    }
    this.onStateChange?.(this.gameState);
  }

  // 游戏循环
  private startLoop() {
    this.lastTime = performance.now();
    this.accumulator = 0;
    const loop = (time: number) => {
      if (this.gameState !== GAME_STATE.PLAYING) {
        this.render();
        this.animationId = requestAnimationFrame(loop);
        return;
      }

      const delta = time - this.lastTime;
      this.lastTime = time;
      this.accumulator += delta;

      while (this.accumulator >= this.FRAME_TIME) {
        this.update();
        this.accumulator -= this.FRAME_TIME;
      }

      this.render();
      this.animationId = requestAnimationFrame(loop);
    };
    cancelAnimationFrame(this.animationId);
    this.animationId = requestAnimationFrame(loop);
  }

  // 更新逻辑
  update() {
    this.animFrame++;
    this.input.update();

    // 暂停检测
    if (this.input.isPause()) {
      this.togglePause();
      return;
    }

    if (this.player.dead) {
      this.updateDeath();
      return;
    }

    if (this.flagReached) {
      this.updateFlagSequence();
      return;
    }

    // 时间
    this.timeCounter++;
    if (this.timeCounter >= 60) {
      this.timeCounter = 0;
      this.time--;
      if (this.time <= 0) {
        this.killPlayer();
        return;
      }
    }

    this.updatePlayer();
    this.updateEnemies();
    this.updateCoins();
    this.updatePowerUps();
    this.updateBlocks();
    this.particles.update();
    this.camera.follow(this.player.x, this.player.y);
    this.updateHUD();
  }

  // 更新玩家
  private updatePlayer() {
    const p = this.player;
    const speed = p.running ? PLAYER_RUN_SPEED : PLAYER_SPEED;
    const accel = p.onGround ? 0.8 : 0.4;

    // 水平移动
    if (this.input.isLeft()) {
      p.vx = Math.max(p.vx - accel, -speed);
      p.direction = DIRECTION.LEFT;
    } else if (this.input.isRight()) {
      p.vx = Math.min(p.vx + accel, speed);
      p.direction = DIRECTION.RIGHT;
    } else {
      p.vx *= p.onGround ? GROUND_FRICTION : FRICTION;
      if (Math.abs(p.vx) < 0.1) p.vx = 0;
    }

    p.running = this.input.isRun();

    // 跳跃
    if (this.input.isJump() && p.onGround && !p.jumping) {
      p.vy = JUMP_FORCE;
      p.onGround = false;
      p.jumping = true;
      this.audio.playJump();
    }

    // 可变跳跃高度 - 松开跳跃键时减少上升速度
    if (!this.input.isJump() && p.vy < -3) {
      p.vy = -3;
    }

    if (!this.input.isJump()) {
      p.jumping = false;
    }

    // 重力
    p.vy = Math.min(p.vy + GRAVITY, MAX_FALL_SPEED);

    // 移动并碰撞检测
    this.moveAndCollide(p);

    // 动画帧
    if (p.onGround && Math.abs(p.vx) > 0.5) {
      p.frameTimer++;
      if (p.frameTimer > 6) {
        p.frameTimer = 0;
        p.frame = (p.frame + 1) % 4;
      }
    } else if (p.onGround) {
      p.frame = 0;
    }

    // 无敌时间递减
    if (p.invincible > 0) p.invincible--;
    if (p.invincibleStar > 0) p.invincibleStar--;

    // 掉落死亡
    if (p.y > this.levelHeight + 50) {
      this.killPlayer();
    }

    // 限制左边界
    if (p.x < 0) p.x = 0;
  }

  // 移动和碰撞
  private moveAndCollide(p: typeof this.player) {
    // 水平移动
    p.x += p.vx;
    this.resolveHorizontalCollision(p);

    // 垂直移动
    p.y += p.vy;
    p.onGround = false;
    this.resolveVerticalCollision(p);
  }

  // 水平碰撞解析
  private resolveHorizontalCollision(p: typeof this.player) {
    const left = Math.floor(p.x / TILE_SIZE);
    const right = Math.floor((p.x + p.width - 1) / TILE_SIZE);
    const top = Math.floor(p.y / TILE_SIZE);
    const bottom = Math.floor((p.y + p.height - 1) / TILE_SIZE);

    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        if (this.isSolidTile(col, row)) {
          if (p.vx > 0) {
            p.x = col * TILE_SIZE - p.width;
            p.vx = 0;
          } else if (p.vx < 0) {
            p.x = (col + 1) * TILE_SIZE;
            p.vx = 0;
          }
        }
      }
    }
  }

  // 垂直碰撞解析
  private resolveVerticalCollision(p: typeof this.player) {
    const left = Math.floor(p.x / TILE_SIZE);
    const right = Math.floor((p.x + p.width - 1) / TILE_SIZE);
    const top = Math.floor(p.y / TILE_SIZE);
    const bottom = Math.floor((p.y + p.height - 1) / TILE_SIZE);

    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        if (this.isSolidTile(col, row)) {
          if (p.vy > 0) {
            // 着地
            p.y = row * TILE_SIZE - p.height;
            p.vy = 0;
            p.onGround = true;
          } else if (p.vy < 0) {
            // 头顶碰撞
            p.y = (row + 1) * TILE_SIZE;
            p.vy = 0;
            this.handleBlockHit(col, row);
          }
        }
      }
    }
  }

  // 处理方块被顶
  private handleBlockHit(col: number, row: number) {
    const tile = this.levelData[row]?.[col];
    if (!tile) return;

    const block = this.blocks.find(b =>
      Math.floor(b.x / TILE_SIZE) === col && Math.floor(b.y / TILE_SIZE) === row
    );

    if (tile === TILE.QUESTION_BLOCK && block && !block.hit) {
      block.hit = true;
      block.bounceOffset = -8;
      this.levelData[row][col] = TILE.USED_BLOCK;

      if (block.content === 'coin' || block.content === 'coins') {
        this.coins++;
        this.score += 200;
        this.audio.playCoin();
        this.particles.emitCoinCollect(col * TILE_SIZE + 16, row * TILE_SIZE);
        if (this.coins >= 100) {
          this.coins = 0;
          this.lives++;
        }
      } else if (block.content === 'mushroom') {
        if (this.player.state === PLAYER_STATE.SMALL) {
          this.powerUps.push({
            x: col * TILE_SIZE, y: row * TILE_SIZE - TILE_SIZE,
            width: 28, height: 28, vx: 0, vy: 0,
            type: 'mushroom', emerging: true, emergeY: row * TILE_SIZE - TILE_SIZE,
            active: true,
          });
        } else {
          this.coins++;
          this.score += 200;
          this.audio.playCoin();
        }
      } else if (block.content === 'star') {
        this.powerUps.push({
          x: col * TILE_SIZE, y: row * TILE_SIZE - TILE_SIZE,
          width: 24, height: 24, vx: 2, vy: 0,
          type: 'star', emerging: false, emergeY: 0,
          active: true,
        });
      }
      this.audio.playBump();
    } else if (tile === TILE.BRICK && block && !block.hit) {
      if (this.player.state !== PLAYER_STATE.SMALL) {
        // 大马里奥破坏砖块
        this.levelData[row][col] = TILE.EMPTY;
        block.hit = true;
        this.particles.emitBrickBreak(col * TILE_SIZE, row * TILE_SIZE);
        this.audio.playBlockBreak();
        this.score += 50;
      } else {
        block.bounceOffset = -6;
        this.audio.playBump();
      }
    } else {
      this.audio.playBump();
    }

    // 顶方块时检查上面的敌人
    this.enemies.forEach(e => {
      if (e.alive && !e.squished) {
        const eCol = Math.floor((e.x + e.width / 2) / TILE_SIZE);
        const eRow = Math.floor((e.y + e.height) / TILE_SIZE);
        if (eCol === col && eRow === row) {
          this.killEnemy(e);
        }
      }
    });
  }

  // 判断是否为实心瓦片
  private isSolidTile(col: number, row: number): boolean {
    if (row < 0 || row >= this.levelData.length) return false;
    if (col < 0 || col >= this.levelData[0].length) return false;
    const tile = this.levelData[row][col];
    return tile === TILE.GROUND || tile === TILE.BRICK || tile === TILE.QUESTION_BLOCK ||
           tile === TILE.USED_BLOCK || tile === TILE.HARD_BLOCK ||
           tile === TILE.PIPE_TL || tile === TILE.PIPE_TR ||
           tile === TILE.PIPE_BL || tile === TILE.PIPE_BR;
  }

  // 更新敌人
  private updateEnemies() {
    this.enemies.forEach(e => {
      if (!e.active) return;

      if (e.squished) {
        e.squishTimer--;
        if (e.squishTimer <= 0) e.active = false;
        return;
      }

      if (!e.alive) return;

      // 只更新屏幕附近的敌人
      if (Math.abs(e.x - this.player.x) > CANVAS_WIDTH * 1.5) return;

      // 移动
      if (e.shell && e.shellMoving) {
        e.vx = e.direction * 8;
      } else if (!e.shell) {
        e.vx = e.direction * 1;
      }

      e.vy += GRAVITY;
      e.vy = Math.min(e.vy, MAX_FALL_SPEED);

      // 水平移动
      e.x += e.vx;
      // 水平碰撞
      const eLeft = Math.floor(e.x / TILE_SIZE);
      const eRight = Math.floor((e.x + e.width - 1) / TILE_SIZE);
      const eTop = Math.floor(e.y / TILE_SIZE);
      const eBottom = Math.floor((e.y + e.height - 1) / TILE_SIZE);

      for (let row = eTop; row <= eBottom; row++) {
        for (let col = eLeft; col <= eRight; col++) {
          if (this.isSolidTile(col, row)) {
            if (e.vx > 0) {
              e.x = col * TILE_SIZE - e.width;
              e.direction = -1;
            } else if (e.vx < 0) {
              e.x = (col + 1) * TILE_SIZE;
              e.direction = 1;
            }
            if (e.shell && e.shellMoving) {
              e.vx = e.direction * 8;
            }
          }
        }
      }

      // 垂直移动
      e.y += e.vy;
      const eLeft2 = Math.floor(e.x / TILE_SIZE);
      const eRight2 = Math.floor((e.x + e.width - 1) / TILE_SIZE);
      const eTop2 = Math.floor(e.y / TILE_SIZE);
      const eBottom2 = Math.floor((e.y + e.height - 1) / TILE_SIZE);

      for (let row = eTop2; row <= eBottom2; row++) {
        for (let col = eLeft2; col <= eRight2; col++) {
          if (this.isSolidTile(col, row)) {
            if (e.vy > 0) {
              e.y = row * TILE_SIZE - e.height;
              e.vy = 0;
            } else if (e.vy < 0) {
              e.y = (row + 1) * TILE_SIZE;
              e.vy = 0;
            }
          }
        }
      }

      // 掉落消失
      if (e.y > this.levelHeight + 100) {
        e.active = false;
      }

      // 与玩家碰撞
      if (!this.player.dead && this.player.invincibleStar <= 0) {
        if (this.checkOverlap(this.player, e)) {
          // 踩踏判定 - 玩家在敌人上方且正在下落
          if (this.player.vy > 0 && this.player.y + this.player.height - 8 < e.y + e.height / 2) {
            this.stompEnemy(e);
          } else if (e.shell && !e.shellMoving) {
            // 踢龟壳
            e.shellMoving = true;
            e.direction = this.player.x < e.x ? 1 : -1;
            this.audio.playStomp();
          } else if (!e.shell || e.shellMoving) {
            this.hurtPlayer();
          }
        }
      } else if (this.player.invincibleStar > 0 && this.checkOverlap(this.player, e)) {
        this.killEnemy(e);
      }
    });
  }

  // 踩踏敌人
  private stompEnemy(e: Enemy) {
    if (e.type === 'koopa' && !e.shell) {
      e.shell = true;
      e.shellMoving = false;
      e.height = 20;
      e.squished = false;
      this.player.vy = -8;
      this.score += 100;
      this.audio.playStomp();
    } else if (e.shell && e.shellMoving) {
      e.shellMoving = false;
      e.vx = 0;
      this.player.vy = -6;
      this.audio.playStomp();
    } else if (e.shell && !e.shellMoving) {
      e.shellMoving = true;
      e.direction = this.player.x < e.x ? 1 : -1;
      this.player.vy = -6;
      this.audio.playStomp();
    } else {
      e.squished = true;
      e.squishTimer = 30;
      e.vx = 0;
      e.vy = 0;
      this.player.vy = -8;
      this.score += 100;
      this.audio.playStomp();
      this.particles.emitStomp(e.x + e.width / 2, e.y);
    }
  }

  // 消灭敌人
  private killEnemy(e: Enemy) {
    e.alive = false;
    e.active = false;
    this.score += 200;
    this.particles.emit(e.x + e.width / 2, e.y, 5, '#FFFFFF');
  }

  // 伤害玩家
  private hurtPlayer() {
    const p = this.player;
    if (p.invincible > 0 || p.invincibleStar > 0) return;

    if (p.state === PLAYER_STATE.FIRE) {
      p.state = PLAYER_STATE.BIG;
      p.invincible = 90;
      this.audio.playBump();
    } else if (p.state === PLAYER_STATE.BIG) {
      p.state = PLAYER_STATE.SMALL;
      p.height = 28;
      p.invincible = 90;
      this.audio.playBump();
    } else {
      this.killPlayer();
    }
  }

  // 玩家死亡
  private killPlayer() {
    if (this.player.dead) return;
    this.player.dead = true;
    this.player.vy = -10;
    this.player.vx = 0;
    this.player.deathTimer = 120;
    this.audio.stopBGM();
    this.audio.playDeath();
  }

  // 更新死亡动画
  private updateDeath() {
    const p = this.player;
    p.deathTimer--;

    if (p.deathTimer > 60) {
      p.vy += GRAVITY;
      p.y += p.vy;
    } else if (p.deathTimer === 60) {
      p.vy = -8;
    } else {
      p.vy += GRAVITY;
      p.y += p.vy;
    }

    if (p.deathTimer <= 0) {
      this.lives--;
      if (this.lives <= 0) {
        this.gameState = GAME_STATE.GAME_OVER;
        this.onStateChange?.(this.gameState);
      } else {
        this.gameState = GAME_STATE.LEVEL_COMPLETE; // 用作重生中间状态
        this.respawn();
      }
    }
  }

  // 更新金币
  private updateCoins() {
    this.coinEntities.forEach(c => {
      if (c.collected || !c.active) return;
      c.animFrame++;

      if (!this.player.dead && this.checkOverlap(this.player, c)) {
        c.collected = true;
        this.coins++;
        this.score += 200;
        this.audio.playCoin();
        this.particles.emitCoinCollect(c.x + 8, c.y);
        if (this.coins >= 100) {
          this.coins = 0;
          this.lives++;
        }
      }
    });
  }

  // 更新道具
  private updatePowerUps() {
    this.powerUps.forEach(pu => {
      if (!pu.active) return;

      if (pu.emerging) {
        pu.y -= 1;
        if (pu.y <= pu.emergeY) {
          pu.emerging = false;
          pu.vx = 2;
        }
        return;
      }

      pu.vy += GRAVITY;
      pu.vy = Math.min(pu.vy, MAX_FALL_SPEED);

      pu.x += pu.vx;
      // 水平碰撞
      const left = Math.floor(pu.x / TILE_SIZE);
      const right = Math.floor((pu.x + pu.width - 1) / TILE_SIZE);
      const top = Math.floor(pu.y / TILE_SIZE);
      const bottom = Math.floor((pu.y + pu.height - 1) / TILE_SIZE);

      for (let row = top; row <= bottom; row++) {
        for (let col = left; col <= right; col++) {
          if (this.isSolidTile(col, row)) {
            if (pu.vx > 0) {
              pu.x = col * TILE_SIZE - pu.width;
              pu.vx = -pu.vx;
            } else if (pu.vx < 0) {
              pu.x = (col + 1) * TILE_SIZE;
              pu.vx = -pu.vx;
            }
          }
        }
      }

      pu.y += pu.vy;
      const left2 = Math.floor(pu.x / TILE_SIZE);
      const right2 = Math.floor((pu.x + pu.width - 1) / TILE_SIZE);
      const top2 = Math.floor(pu.y / TILE_SIZE);
      const bottom2 = Math.floor((pu.y + pu.height - 1) / TILE_SIZE);

      for (let row = top2; row <= bottom2; row++) {
        for (let col = left2; col <= right2; col++) {
          if (this.isSolidTile(col, row)) {
            if (pu.vy > 0) {
              pu.y = row * TILE_SIZE - pu.height;
              pu.vy = 0;
            }
          }
        }
      }

      // 与玩家碰撞
      if (!this.player.dead && this.checkOverlap(this.player, pu)) {
        pu.active = false;
        if (pu.type === 'mushroom') {
          if (this.player.state === PLAYER_STATE.SMALL) {
            this.player.state = PLAYER_STATE.BIG;
            this.player.height = 48;
            this.player.y -= 20;
          }
          this.score += 1000;
          this.audio.playPowerUp();
        } else if (pu.type === 'star') {
          this.player.invincibleStar = 600;
          this.score += 1000;
          this.audio.playPowerUp();
        }
      }

      if (pu.y > this.levelHeight + 50) {
        pu.active = false;
      }
    });
  }

  // 更新方块弹跳动画
  private updateBlocks() {
    this.blocks.forEach(b => {
      if (b.bounceOffset < 0) {
        b.bounceOffset += 2;
        if (b.bounceOffset > 0) b.bounceOffset = 0;
      }
    });
  }

  // 旗帜序列
  private updateFlagSequence() {
    if (this.flagSliding) {
      this.flagY += 3;
      this.player.y += 3;
      const groundY = this.levelHeight - TILE_SIZE * 3 - this.player.height;
      if (this.player.y >= groundY) {
        this.player.y = groundY;
        this.flagSliding = false;
        this.player.direction = DIRECTION.RIGHT;
      }
    } else {
      this.player.x += 2;
      this.levelCompleteTimer++;
      if (this.levelCompleteTimer > 120) {
        // 时间转分数
        if (this.time > 0) {
          this.time--;
          this.score += 50;
        } else {
          this.audio.stopBGM();
          if (this.currentLevel < 2) {
            this.gameState = GAME_STATE.LEVEL_COMPLETE;
            this.onStateChange?.(this.gameState);
          } else {
            this.gameState = GAME_STATE.WIN;
            this.onStateChange?.(this.gameState);
          }
        }
      }
    }
  }

  // 碰撞检测辅助
  private checkOverlap(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): boolean {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
  }

  // 检查是否到达旗帜
  private checkFlagReach() {
    const col = Math.floor((this.player.x + this.player.width / 2) / TILE_SIZE);

    for (let r = 0; r < this.levelData.length; r++) {
      if (this.levelData[r][col] === TILE.FLAG_TOP || this.levelData[r][col] === TILE.FLAG_POLE) {
        this.flagReached = true;
        this.flagSliding = true;
        this.player.vx = 0;
        this.player.vy = 0;
        this.audio.playFlagpole();
        this.score += 2000;
        return;
      }
    }
  }

  // 渲染
  render() {
    const ctx = this.ctx;
    const cam = this.camera;

    // 清屏 - 天空
    ctx.fillStyle = COLORS.SKY;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (this.gameState === GAME_STATE.MENU) return;

    // 背景元素
    this.renderBackground(ctx, cam);

    // 瓦片地图
    this.renderTiles(ctx, cam);

    // 金币
    this.coinEntities.forEach(c => {
      if (c.collected || !c.active) return;
      if (!cam.isVisible(c.x, c.y, c.width, c.height)) return;
      SpriteRenderer.drawCoin(ctx, c.x - cam.x, c.y - cam.y, c.animFrame);
    });

    // 道具
    this.powerUps.forEach(pu => {
      if (!pu.active) return;
      if (!cam.isVisible(pu.x, pu.y, pu.width, pu.height)) return;
      if (pu.type === 'mushroom') {
        SpriteRenderer.drawMushroom(ctx, pu.x - cam.x, pu.y - cam.y);
      } else if (pu.type === 'star') {
        SpriteRenderer.drawStar(ctx, pu.x - cam.x, pu.y - cam.y, this.animFrame);
      }
    });

    // 敌人
    this.enemies.forEach(e => {
      if (!e.active) return;
      if (!cam.isVisible(e.x, e.y, e.width, e.height)) return;
      if (e.squished) {
        ctx.fillStyle = e.type === 'goomba' ? COLORS.GOOMBA_BROWN : COLORS.KOOPA_GREEN;
        ctx.fillRect(e.x - cam.x, e.y - cam.y + e.height - 8, e.width, 8);
        return;
      }
      if (e.type === 'goomba') {
        SpriteRenderer.drawGoomba(ctx, e.x - cam.x, e.y - cam.y, this.animFrame);
      } else if (e.type === 'koopa') {
        if (e.shell) {
          ctx.fillStyle = COLORS.KOOPA_GREEN;
          ctx.beginPath();
          ctx.ellipse(e.x - cam.x + 14, e.y - cam.y + 10, 14, 10, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#20C820';
          ctx.beginPath();
          ctx.ellipse(e.x - cam.x + 14, e.y - cam.y + 8, 10, 6, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          SpriteRenderer.drawKoopa(ctx, e.x - cam.x, e.y - cam.y, this.animFrame);
        }
      }
    });

    // 玩家
    this.renderPlayer(ctx, cam);

    // 粒子
    this.particles.render(ctx, cam.x, cam.y);

    // 暂停覆盖层
    if (this.gameState === GAME_STATE.PAUSED) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '24px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    }
  }

  // 渲染背景
  private renderBackground(ctx: CanvasRenderingContext2D, cam: Camera) {
    // 云朵（视差滚动）
    this.clouds.forEach(c => {
      const sx = c.x - cam.x * 0.3;
      const mod = (sx % (this.levelWidth * 0.3) + this.levelWidth * 0.3) % (this.levelWidth * 0.3);
      if (mod < CANVAS_WIDTH + 100) {
        SpriteRenderer.drawCloud(ctx, mod, c.y, c.size);
      }
    });

    // 山丘（视差滚动）
    this.hills.forEach(h => {
      const sx = h.x - cam.x * 0.5;
      if (sx > -200 && sx < CANVAS_WIDTH + 200) {
        SpriteRenderer.drawHill(ctx, sx, h.y - cam.y, h.size);
      }
    });

    // 灌木
    this.bushes.forEach(b => {
      const sx = b.x - cam.x;
      if (sx > -100 && sx < CANVAS_WIDTH + 100) {
        SpriteRenderer.drawBush(ctx, sx, b.y - cam.y, b.size);
      }
    });
  }

  // 渲染瓦片
  private renderTiles(ctx: CanvasRenderingContext2D, cam: Camera) {
    const startCol = Math.max(0, Math.floor(cam.x / TILE_SIZE));
    const endCol = Math.min(this.levelData[0]?.length || 0, Math.ceil((cam.x + CANVAS_WIDTH) / TILE_SIZE) + 1);
    const startRow = 0;
    const endRow = this.levelData.length;

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const tile = this.levelData[row]?.[col];
        if (!tile || tile === TILE.EMPTY) continue;

        const x = col * TILE_SIZE - cam.x;
        let y = row * TILE_SIZE - cam.y;

        // 方块弹跳偏移
        const block = this.blocks.find(b =>
          Math.floor(b.x / TILE_SIZE) === col && Math.floor(b.y / TILE_SIZE) === row
        );
        if (block && block.bounceOffset !== 0) {
          y += block.bounceOffset;
        }

        SpriteRenderer.drawTile(ctx, tile, x, y, this.animFrame);
      }
    }
  }

  // 渲染玩家
  private renderPlayer(ctx: CanvasRenderingContext2D, cam: Camera) {
    const p = this.player;

    // 无敌闪烁
    if (p.invincible > 0 && Math.floor(p.invincible / 3) % 2 === 0) return;
    if (p.invincibleStar > 0 && Math.floor(p.invincibleStar / 2) % 2 === 0) {
      // 无敌星闪烁 - 不同颜色
    }

    const x = p.x - cam.x;
    const y = p.y - cam.y;

    if (p.dead) {
      // 死亡动画 - 翻转的马里奥
      ctx.save();
      ctx.translate(x + p.width / 2, y + p.height / 2);
      ctx.rotate(p.deathTimer * 0.1);
      SpriteRenderer.drawSmallMario(ctx, -p.width / 2, -p.height / 2, 0, 1, true);
      ctx.restore();
      return;
    }

    if (p.state === PLAYER_STATE.SMALL) {
      SpriteRenderer.drawSmallMario(ctx, x, y, p.frame, p.direction, !p.onGround);
    } else {
      SpriteRenderer.drawBigMario(ctx, x, y, p.frame, p.direction, !p.onGround);
    }
  }

  // 更新HUD
  private updateHUD() {
    const levelName = `1-${this.currentLevel + 1}`;
    this.onScoreChange?.(this.score, this.coins, this.lives, this.time, levelName);

    // 检查旗帜
    if (!this.flagReached) {
      this.checkFlagReach();
    }
  }

  // 销毁
  destroy() {
    cancelAnimationFrame(this.animationId);
    this.audio.stopBGM();
    this.input.destroy();
  }
}

// ============ 关卡数据 ============

function getLevel1Data() {
  const W = 210;
  const H = 15;
  const tiles: number[][] = Array.from({ length: H }, () => Array(W).fill(0));

  // 地面 (最下面2行)
  for (let col = 0; col < W; col++) {
    tiles[H - 1][col] = TILE.GROUND;
    tiles[H - 2][col] = TILE.GROUND;
    // 留一些坑
    if ((col >= 69 && col <= 71) || (col >= 86 && col <= 89) || (col >= 153 && col <= 155)) {
      tiles[H - 1][col] = TILE.EMPTY;
      tiles[H - 2][col] = TILE.EMPTY;
    }
  }

  // 问号方块和砖块
  tiles[H - 6][16] = TILE.QUESTION_BLOCK;
  tiles[H - 6][21] = TILE.BRICK;
  tiles[H - 6][22] = TILE.QUESTION_BLOCK;
  tiles[H - 6][23] = TILE.BRICK;
  tiles[H - 6][24] = TILE.QUESTION_BLOCK;
  tiles[H - 6][25] = TILE.BRICK;
  tiles[H - 10][23] = TILE.QUESTION_BLOCK;

  // 管道
  const pipePositions = [
    { col: 28, height: 2 },
    { col: 38, height: 3 },
    { col: 46, height: 4 },
    { col: 57, height: 4 },
  ];
  pipePositions.forEach(pipe => {
    for (let i = 0; i < pipe.height; i++) {
      const row = H - 3 - i;
      if (i === pipe.height - 1) {
        tiles[row][pipe.col] = TILE.PIPE_TL;
        tiles[row][pipe.col + 1] = TILE.PIPE_TR;
      } else {
        tiles[row][pipe.col] = TILE.PIPE_BL;
        tiles[row][pipe.col + 1] = TILE.PIPE_BR;
      }
    }
  });

  // 第二组方块
  tiles[H - 6][78] = TILE.QUESTION_BLOCK;
  tiles[H - 6][79] = TILE.BRICK;
  tiles[H - 6][80] = TILE.QUESTION_BLOCK;

  // 高处方块
  tiles[H - 10][80] = TILE.BRICK;
  tiles[H - 10][81] = TILE.BRICK;
  tiles[H - 10][82] = TILE.BRICK;
  tiles[H - 10][83] = TILE.BRICK;
  tiles[H - 10][84] = TILE.BRICK;
  tiles[H - 10][85] = TILE.BRICK;
  tiles[H - 10][86] = TILE.BRICK;
  tiles[H - 10][87] = TILE.BRICK;

  // 更多方块
  tiles[H - 6][91] = TILE.BRICK;
  tiles[H - 6][92] = TILE.BRICK;
  tiles[H - 6][93] = TILE.QUESTION_BLOCK;
  tiles[H - 6][94] = TILE.BRICK;

  // 阶梯
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j <= i; j++) {
      tiles[H - 3 - j][134 + i] = TILE.HARD_BLOCK;
    }
  }
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j <= 3 - i; j++) {
      tiles[H - 3 - j][139 + i] = TILE.HARD_BLOCK;
    }
  }

  // 终点阶梯
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j <= i; j++) {
      tiles[H - 3 - j][192 + i] = TILE.HARD_BLOCK;
    }
  }

  // 旗帜
  for (let i = 3; i < H - 2; i++) {
    tiles[i][202] = TILE.FLAG_POLE;
  }
  tiles[2][202] = TILE.FLAG_TOP;

  return {
    tiles,
    enemies: [
      { type: 'goomba' as const, x: 22 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'goomba' as const, x: 40 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'goomba' as const, x: 51 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'goomba' as const, x: 52 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'koopa' as const, x: 107 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'goomba' as const, x: 130 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
    ],
    coins: [
      { x: 17 * TILE_SIZE, y: (H - 7) * TILE_SIZE },
      { x: 18 * TILE_SIZE, y: (H - 7) * TILE_SIZE },
      { x: 19 * TILE_SIZE, y: (H - 7) * TILE_SIZE },
      { x: 81 * TILE_SIZE, y: (H - 11) * TILE_SIZE },
      { x: 82 * TILE_SIZE, y: (H - 11) * TILE_SIZE },
      { x: 83 * TILE_SIZE, y: (H - 11) * TILE_SIZE },
      { x: 84 * TILE_SIZE, y: (H - 11) * TILE_SIZE },
    ],
    playerStart: { x: 3 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
  };
}

function getLevel2Data() {
  const W = 210;
  const H = 15;
  const tiles: number[][] = Array.from({ length: H }, () => Array(W).fill(0));

  // 地面
  for (let col = 0; col < W; col++) {
    tiles[H - 1][col] = TILE.GROUND;
    tiles[H - 2][col] = TILE.GROUND;
    if ((col >= 50 && col <= 53) || (col >= 80 && col <= 84) || (col >= 120 && col <= 124)) {
      tiles[H - 1][col] = TILE.EMPTY;
      tiles[H - 2][col] = TILE.EMPTY;
    }
  }

  // 更多砖块和问号
  tiles[H - 6][12] = TILE.BRICK;
  tiles[H - 6][13] = TILE.QUESTION_BLOCK;
  tiles[H - 6][14] = TILE.BRICK;
  tiles[H - 6][15] = TILE.QUESTION_BLOCK;
  tiles[H - 6][16] = TILE.BRICK;

  tiles[H - 10][14] = TILE.QUESTION_BLOCK;

  // 管道
  const pipes = [
    { col: 25, height: 3 },
    { col: 35, height: 4 },
    { col: 45, height: 2 },
    { col: 60, height: 3 },
    { col: 95, height: 4 },
  ];
  pipes.forEach(pipe => {
    for (let i = 0; i < pipe.height; i++) {
      const row = H - 3 - i;
      if (i === pipe.height - 1) {
        tiles[row][pipe.col] = TILE.PIPE_TL;
        tiles[row][pipe.col + 1] = TILE.PIPE_TR;
      } else {
        tiles[row][pipe.col] = TILE.PIPE_BL;
        tiles[row][pipe.col + 1] = TILE.PIPE_BR;
      }
    }
  });

  // 浮空平台
  for (let i = 0; i < 5; i++) {
    tiles[H - 6][65 + i] = TILE.BRICK;
  }
  for (let i = 0; i < 3; i++) {
    tiles[H - 9][70 + i] = TILE.BRICK;
  }
  for (let i = 0; i < 4; i++) {
    tiles[H - 6][75 + i] = TILE.QUESTION_BLOCK;
  }

  // 阶梯
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j <= i; j++) {
      tiles[H - 3 - j][140 + i] = TILE.HARD_BLOCK;
    }
  }
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j <= 4 - i; j++) {
      tiles[H - 3 - j][146 + i] = TILE.HARD_BLOCK;
    }
  }

  // 终点阶梯
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j <= i; j++) {
      tiles[H - 3 - j][190 + i] = TILE.HARD_BLOCK;
    }
  }

  // 旗帜
  for (let i = 3; i < H - 2; i++) {
    tiles[i][201] = TILE.FLAG_POLE;
  }
  tiles[2][201] = TILE.FLAG_TOP;

  return {
    tiles,
    enemies: [
      { type: 'goomba' as const, x: 15 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'goomba' as const, x: 30 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'goomba' as const, x: 31 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'koopa' as const, x: 40 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'goomba' as const, x: 62 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'goomba' as const, x: 63 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'koopa' as const, x: 90 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'goomba' as const, x: 100 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'goomba' as const, x: 110 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'goomba' as const, x: 111 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
    ],
    coins: [
      { x: 13 * TILE_SIZE, y: (H - 7) * TILE_SIZE },
      { x: 14 * TILE_SIZE, y: (H - 7) * TILE_SIZE },
      { x: 66 * TILE_SIZE, y: (H - 7) * TILE_SIZE },
      { x: 67 * TILE_SIZE, y: (H - 7) * TILE_SIZE },
      { x: 68 * TILE_SIZE, y: (H - 7) * TILE_SIZE },
      { x: 71 * TILE_SIZE, y: (H - 10) * TILE_SIZE },
      { x: 72 * TILE_SIZE, y: (H - 10) * TILE_SIZE },
      { x: 76 * TILE_SIZE, y: (H - 7) * TILE_SIZE },
      { x: 77 * TILE_SIZE, y: (H - 7) * TILE_SIZE },
    ],
    playerStart: { x: 3 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
  };
}

function getLevel3Data() {
  const W = 210;
  const H = 15;
  const tiles: number[][] = Array.from({ length: H }, () => Array(W).fill(0));

  // 地面 - 更多坑
  for (let col = 0; col < W; col++) {
    tiles[H - 1][col] = TILE.GROUND;
    tiles[H - 2][col] = TILE.GROUND;
    // 大量坑洞
    if ((col >= 30 && col <= 34) || (col >= 55 && col <= 60) ||
        (col >= 85 && col <= 90) || (col >= 115 && col <= 120) ||
        (col >= 145 && col <= 148)) {
      tiles[H - 1][col] = TILE.EMPTY;
      tiles[H - 2][col] = TILE.EMPTY;
    }
  }

  // 方块布局
  tiles[H - 6][10] = TILE.QUESTION_BLOCK;
  tiles[H - 6][11] = TILE.BRICK;
  tiles[H - 6][12] = TILE.QUESTION_BLOCK;
  tiles[H - 6][13] = TILE.BRICK;
  tiles[H - 6][14] = TILE.QUESTION_BLOCK;
  tiles[H - 10][12] = TILE.QUESTION_BLOCK;

  // 管道
  const pipes = [
    { col: 20, height: 3 },
    { col: 40, height: 5 },
    { col: 65, height: 3 },
    { col: 100, height: 4 },
    { col: 130, height: 3 },
  ];
  pipes.forEach(pipe => {
    for (let i = 0; i < pipe.height; i++) {
      const row = H - 3 - i;
      if (i === pipe.height - 1) {
        tiles[row][pipe.col] = TILE.PIPE_TL;
        tiles[row][pipe.col + 1] = TILE.PIPE_TR;
      } else {
        tiles[row][pipe.col] = TILE.PIPE_BL;
        tiles[row][pipe.col + 1] = TILE.PIPE_BR;
      }
    }
  });

  // 浮空平台
  for (let i = 0; i < 3; i++) {
    tiles[H - 5][35 + i] = TILE.BRICK;
  }
  for (let i = 0; i < 3; i++) {
    tiles[H - 8][40 + i] = TILE.BRICK;
  }
  for (let i = 0; i < 4; i++) {
    tiles[H - 5][48 + i] = TILE.QUESTION_BLOCK;
  }

  // 高难度区域
  for (let i = 0; i < 2; i++) {
    tiles[H - 5][92 + i] = TILE.BRICK;
  }
  for (let i = 0; i < 2; i++) {
    tiles[H - 8][96 + i] = TILE.BRICK;
  }
  for (let i = 0; i < 2; i++) {
    tiles[H - 5][100 + i] = TILE.BRICK;
  }

  // 阶梯
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j <= i; j++) {
      tiles[H - 3 - j][155 + i] = TILE.HARD_BLOCK;
    }
  }
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j <= 5 - i; j++) {
      tiles[H - 3 - j][162 + i] = TILE.HARD_BLOCK;
    }
  }

  // 终点阶梯
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j <= i; j++) {
      tiles[H - 3 - j][188 + i] = TILE.HARD_BLOCK;
    }
  }

  // 旗帜
  for (let i = 3; i < H - 2; i++) {
    tiles[i][199] = TILE.FLAG_POLE;
  }
  tiles[2][199] = TILE.FLAG_TOP;

  return {
    tiles,
    enemies: [
      { type: 'goomba' as const, x: 12 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'goomba' as const, x: 13 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'koopa' as const, x: 25 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'goomba' as const, x: 45 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'goomba' as const, x: 46 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'koopa' as const, x: 70 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'goomba' as const, x: 75 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'goomba' as const, x: 76 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'koopa' as const, x: 105 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'goomba' as const, x: 110 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'goomba' as const, x: 111 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'goomba' as const, x: 135 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
      { type: 'koopa' as const, x: 140 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
    ],
    coins: [
      { x: 11 * TILE_SIZE, y: (H - 7) * TILE_SIZE },
      { x: 12 * TILE_SIZE, y: (H - 7) * TILE_SIZE },
      { x: 36 * TILE_SIZE, y: (H - 6) * TILE_SIZE },
      { x: 37 * TILE_SIZE, y: (H - 6) * TILE_SIZE },
      { x: 41 * TILE_SIZE, y: (H - 9) * TILE_SIZE },
      { x: 42 * TILE_SIZE, y: (H - 9) * TILE_SIZE },
      { x: 49 * TILE_SIZE, y: (H - 6) * TILE_SIZE },
      { x: 50 * TILE_SIZE, y: (H - 6) * TILE_SIZE },
      { x: 51 * TILE_SIZE, y: (H - 6) * TILE_SIZE },
    ],
    playerStart: { x: 3 * TILE_SIZE, y: (H - 3) * TILE_SIZE },
  };
}
