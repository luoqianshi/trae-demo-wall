import { COLORS, TILE_SIZE } from './Constants';

// 像素数据定义 - 每个精灵用二维数组表示，0=透明，数字=颜色索引
const MARIO_SMALL_STAND_R = [
  [0,0,0,1,1,1,1,0],
  [0,0,1,1,1,1,1,1],
  [0,0,3,3,2,2,3,0],
  [0,3,2,3,2,2,3,2],
  [0,3,2,3,3,2,2,2],
  [0,0,3,2,2,2,3,0],
  [0,0,2,2,2,2,2,0],
  [0,0,2,2,0,2,2,0],
];

const MARIO_SMALL_WALK_R = [
  [0,0,0,1,1,1,1,0],
  [0,0,1,1,1,1,1,1],
  [0,0,3,3,2,2,3,0],
  [0,3,2,3,2,2,3,2],
  [0,3,2,3,3,2,2,2],
  [0,0,3,2,2,2,3,0],
  [0,0,2,0,0,2,0,0],
  [0,0,2,0,0,0,2,0],
];

const MARIO_SMALL_JUMP_R = [
  [0,0,0,1,1,1,1,0],
  [0,0,1,1,1,1,1,1],
  [0,0,3,3,2,2,3,0],
  [0,3,2,3,2,2,3,2],
  [0,3,2,3,3,2,2,2],
  [0,0,3,2,2,2,3,0],
  [0,2,2,2,0,2,2,0],
  [2,0,0,2,2,0,0,2],
];

const MARIO_BIG_STAND_R = [
  [0,0,0,0,1,1,1,1,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,0,0],
  [0,0,0,3,3,2,2,3,0,0,0,0],
  [0,0,3,2,3,2,2,3,2,0,0,0],
  [0,0,3,2,3,3,2,2,2,0,0,0],
  [0,0,0,3,2,2,2,3,0,0,0,0],
  [0,0,0,2,2,2,2,2,0,0,0,0],
  [0,0,2,2,2,2,2,2,2,0,0,0],
  [0,2,2,2,2,2,2,2,2,2,0,0],
  [0,2,2,0,0,2,2,0,2,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0],
];

const GOOMBA_SPRITE = [
  [0,0,0,0,0,1,1,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,0,0],
  [0,1,1,4,4,1,1,4,4,1,1,0],
  [1,1,1,4,4,1,1,4,4,1,1,1],
  [1,1,1,1,1,3,3,1,1,1,1,1],
  [1,1,1,1,3,3,3,3,1,1,1,1],
  [0,0,0,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1,1],
];

const KOOPA_SPRITE = [
  [0,0,0,0,0,5,5,0,0,0,0,0],
  [0,0,0,0,5,5,5,5,0,0,0,0],
  [0,0,0,5,5,4,4,5,5,0,0,0],
  [0,0,0,5,5,4,4,5,5,0,0,0],
  [0,0,0,0,5,5,5,5,0,0,0,0],
  [0,0,0,5,5,5,5,5,5,0,0,0],
  [0,0,5,5,5,5,5,5,5,5,0,0],
  [0,5,5,5,5,5,5,5,5,5,5,0],
  [0,5,3,3,5,5,5,5,3,3,5,0],
  [0,5,3,3,5,5,5,5,3,3,5,0],
  [0,0,5,5,0,0,0,0,5,5,0,0],
  [0,0,3,3,0,0,0,0,3,3,0,0],
];

// 颜色映射
const MARIO_PALETTE: Record<number, string> = {
  1: COLORS.MARIO_RED,
  2: COLORS.MARIO_SKIN,
  3: COLORS.MARIO_BROWN,
  4: '#FFFFFF',
};

const GOOMBA_PALETTE: Record<number, string> = {
  1: COLORS.GOOMBA_BROWN,
  3: '#000000',
  4: '#FFFFFF',
};

const KOOPA_PALETTE: Record<number, string> = {
  1: COLORS.KOOPA_GREEN,
  3: '#000000',
  4: '#FFFFFF',
  5: '#20C820',
};

export class SpriteRenderer {
  private static spriteCache: Map<string, HTMLCanvasElement> = new Map();

  static drawPixelSprite(
    ctx: CanvasRenderingContext2D,
    sprite: number[][],
    palette: Record<number, string>,
    x: number, y: number,
    scale: number = 3,
    flipX: boolean = false
  ) {
    const cacheKey = `${sprite.length}_${flipX}_${JSON.stringify(palette)}_${scale}`;
    let cached = this.spriteCache.get(cacheKey);

    if (!cached) {
      const h = sprite.length;
      const w = sprite[0].length;
      cached = document.createElement('canvas');
      cached.width = w * scale;
      cached.height = h * scale;
      const cctx = cached.getContext('2d')!;

      for (let row = 0; row < h; row++) {
        for (let col = 0; col < w; col++) {
          const val = sprite[row][col];
          if (val === 0) continue;
          const color = palette[val];
          if (!color) continue;
          cctx.fillStyle = color;
          const drawCol = flipX ? (w - 1 - col) : col;
          cctx.fillRect(drawCol * scale, row * scale, scale, scale);
        }
      }
      this.spriteCache.set(cacheKey, cached);
    }

    ctx.drawImage(cached, x, y);
  }

  // 绘制小马里奥
  static drawSmallMario(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, dir: number, jumping: boolean) {
    const sprite = jumping ? MARIO_SMALL_JUMP_R : (frame % 2 === 0 ? MARIO_SMALL_STAND_R : MARIO_SMALL_WALK_R);
    const flipX = dir < 0;
    this.drawPixelSprite(ctx, sprite, MARIO_PALETTE, x, y, 3, flipX);
  }

  // 绘制大马里奥
  static drawBigMario(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, dir: number, jumping: boolean) {
    const sprite = MARIO_BIG_STAND_R;
    const flipX = dir < 0;
    this.drawPixelSprite(ctx, sprite, MARIO_PALETTE, x, y, 2.5, flipX);
  }

  // 绘制Goomba
  static drawGoomba(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
    this.drawPixelSprite(ctx, GOOMBA_SPRITE, GOOMBA_PALETTE, x, y, 2.5, false);
  }

  // 绘制Koopa
  static drawKoopa(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
    this.drawPixelSprite(ctx, KOOPA_SPRITE, KOOPA_PALETTE, x, y, 2.5, false);
  }

  // 绘制金币动画
  static drawCoin(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
    const phase = Math.floor(frame / 8) % 4;
    const widths = [12, 8, 4, 8];
    const w = widths[phase];
    const offset = (12 - w) / 2;
    ctx.fillStyle = COLORS.COIN_GOLD;
    ctx.fillRect(x + offset, y + 2, w, 20);
    ctx.fillStyle = COLORS.COIN_DARK;
    ctx.fillRect(x + offset + 2, y + 4, Math.max(w - 4, 1), 16);
    ctx.fillStyle = COLORS.COIN_GOLD;
    ctx.fillRect(x + offset + 3, y + 6, Math.max(w - 6, 1), 12);
  }

  // 绘制蘑菇道具
  static drawMushroom(ctx: CanvasRenderingContext2D, x: number, y: number) {
    // 蘑菇帽
    ctx.fillStyle = COLORS.MUSHROOM_RED;
    ctx.beginPath();
    ctx.arc(x + 14, y + 10, 14, Math.PI, 0);
    ctx.fill();
    // 白色斑点
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x + 8, y + 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 20, y + 4, 4, 0, Math.PI * 2);
    ctx.fill();
    // 蘑菇柄
    ctx.fillStyle = COLORS.MARIO_SKIN;
    ctx.fillRect(x + 6, y + 10, 16, 12);
    // 眼睛
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 8, y + 14, 3, 3);
    ctx.fillRect(x + 17, y + 14, 3, 3);
  }

  // 绘制星星道具
  static drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
    ctx.fillStyle = frame % 10 < 5 ? COLORS.STAR_YELLOW : '#FFFFFF';
    const cx = x + 12;
    const cy = y + 12;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const px = cx + 10 * Math.cos(angle);
      const py = cy + 10 * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  // 绘制瓦片
  static drawTile(ctx: CanvasRenderingContext2D, type: number, x: number, y: number, frame: number) {
    switch (type) {
      case 1: // GROUND
        this.drawGroundTile(ctx, x, y);
        break;
      case 2: // BRICK
        this.drawBrickTile(ctx, x, y);
        break;
      case 3: // QUESTION_BLOCK
        this.drawQuestionBlock(ctx, x, y, frame);
        break;
      case 4: // USED_BLOCK
        this.drawUsedBlock(ctx, x, y);
        break;
      case 5: // PIPE_TL
        this.drawPipeTopLeft(ctx, x, y);
        break;
      case 6: // PIPE_TR
        this.drawPipeTopRight(ctx, x, y);
        break;
      case 7: // PIPE_BL
        this.drawPipeBodyLeft(ctx, x, y);
        break;
      case 8: // PIPE_BR
        this.drawPipeBodyRight(ctx, x, y);
        break;
      case 9: // FLAG_POLE
        this.drawFlagPole(ctx, x, y);
        break;
      case 10: // FLAG_TOP
        this.drawFlagTop(ctx, x, y);
        break;
      case 11: // HARD_BLOCK
        this.drawHardBlock(ctx, x, y);
        break;
    }
  }

  private static drawGroundTile(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = COLORS.GROUND;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = COLORS.GROUND_DARK;
    ctx.fillRect(x, y, TILE_SIZE, 2);
    ctx.fillRect(x, y, 2, TILE_SIZE);
    // 砖块纹理
    ctx.fillStyle = COLORS.GROUND_DARK;
    ctx.fillRect(x + 15, y, 2, TILE_SIZE);
    ctx.fillRect(x, y + 15, TILE_SIZE, 2);
  }

  private static drawBrickTile(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = COLORS.BRICK;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = COLORS.BRICK_DARK;
    // 砖缝
    ctx.fillRect(x, y + 7, TILE_SIZE, 2);
    ctx.fillRect(x, y + 23, TILE_SIZE, 2);
    ctx.fillRect(x + 15, y, 2, 7);
    ctx.fillRect(x + 7, y + 9, 2, 14);
    ctx.fillRect(x + 23, y + 9, 2, 14);
    ctx.fillRect(x + 15, y + 25, 2, 7);
  }

  private static drawQuestionBlock(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
    const bounce = Math.sin(frame * 0.1) * 2;
    ctx.fillStyle = COLORS.QUESTION;
    ctx.fillRect(x, y + bounce, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = COLORS.QUESTION_DARK;
    ctx.fillRect(x, y + bounce, TILE_SIZE, 2);
    ctx.fillRect(x, y + bounce, 2, TILE_SIZE);
    ctx.fillRect(x, y + TILE_SIZE - 2 + bounce, TILE_SIZE, 2);
    ctx.fillRect(x + TILE_SIZE - 2, y + bounce, 2, TILE_SIZE);
    // 问号
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('?', x + TILE_SIZE / 2, y + TILE_SIZE / 2 + 6 + bounce);
  }

  private static drawUsedBlock(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = COLORS.USED_BLOCK;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#666666';
    ctx.fillRect(x, y, TILE_SIZE, 2);
    ctx.fillRect(x, y, 2, TILE_SIZE);
    ctx.fillRect(x, y + TILE_SIZE - 2, TILE_SIZE, 2);
    ctx.fillRect(x + TILE_SIZE - 2, y, 2, TILE_SIZE);
  }

  private static drawPipeTopLeft(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = COLORS.PIPE_GREEN;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = COLORS.PIPE_GREEN_LIGHT;
    ctx.fillRect(x, y, 4, TILE_SIZE);
    ctx.fillStyle = COLORS.PIPE_GREEN_DARK;
    ctx.fillRect(x + TILE_SIZE - 4, y, 4, TILE_SIZE);
    ctx.fillStyle = COLORS.PIPE_GREEN_DARK;
    ctx.fillRect(x, y, TILE_SIZE, 4);
  }

  private static drawPipeTopRight(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = COLORS.PIPE_GREEN;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = COLORS.PIPE_GREEN_LIGHT;
    ctx.fillRect(x, y, 4, TILE_SIZE);
    ctx.fillStyle = COLORS.PIPE_GREEN_DARK;
    ctx.fillRect(x + TILE_SIZE - 4, y, 4, TILE_SIZE);
    ctx.fillStyle = COLORS.PIPE_GREEN_DARK;
    ctx.fillRect(x, y, TILE_SIZE, 4);
  }

  private static drawPipeBodyLeft(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = COLORS.PIPE_GREEN;
    ctx.fillRect(x + 4, y, TILE_SIZE - 4, TILE_SIZE);
    ctx.fillStyle = COLORS.PIPE_GREEN_LIGHT;
    ctx.fillRect(x + 4, y, 4, TILE_SIZE);
    ctx.fillStyle = COLORS.PIPE_GREEN_DARK;
    ctx.fillRect(x + TILE_SIZE - 4, y, 4, TILE_SIZE);
  }

  private static drawPipeBodyRight(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = COLORS.PIPE_GREEN;
    ctx.fillRect(x, y, TILE_SIZE - 4, TILE_SIZE);
    ctx.fillStyle = COLORS.PIPE_GREEN_LIGHT;
    ctx.fillRect(x, y, 4, TILE_SIZE);
    ctx.fillStyle = COLORS.PIPE_GREEN_DARK;
    ctx.fillRect(x + TILE_SIZE - 8, y, 4, TILE_SIZE);
  }

  private static drawFlagPole(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = '#888888';
    ctx.fillRect(x + 14, y, 4, TILE_SIZE);
  }

  private static drawFlagTop(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = '#888888';
    ctx.fillRect(x + 14, y + 8, 4, TILE_SIZE - 8);
    // 旗帜
    ctx.fillStyle = COLORS.FLAG_GREEN;
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 8);
    ctx.lineTo(x - 6, y + 16);
    ctx.lineTo(x + 14, y + 24);
    ctx.closePath();
    ctx.fill();
    // 球
    ctx.fillStyle = '#FCA044';
    ctx.beginPath();
    ctx.arc(x + 16, y + 6, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  private static drawHardBlock(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = '#888888';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#AAAAAA';
    ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    ctx.fillStyle = '#888888';
    ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
  }

  // 绘制背景元素
  static drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, size: number = 1) {
    ctx.fillStyle = '#FFFFFF';
    const s = size;
    ctx.beginPath();
    ctx.arc(x + 16 * s, y + 16 * s, 12 * s, 0, Math.PI * 2);
    ctx.arc(x + 32 * s, y + 12 * s, 16 * s, 0, Math.PI * 2);
    ctx.arc(x + 48 * s, y + 16 * s, 12 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  static drawHill(ctx: CanvasRenderingContext2D, x: number, y: number, size: number = 1) {
    ctx.fillStyle = '#20C820';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 40 * size, y - 60 * size, x + 80 * size, y);
    ctx.fill();
    ctx.fillStyle = '#00A800';
    ctx.beginPath();
    ctx.moveTo(x + 10 * size, y);
    ctx.quadraticCurveTo(x + 40 * size, y - 50 * size, x + 70 * size, y);
    ctx.fill();
  }

  static drawBush(ctx: CanvasRenderingContext2D, x: number, y: number, size: number = 1) {
    ctx.fillStyle = '#00A800';
    const s = size;
    ctx.beginPath();
    ctx.arc(x + 10 * s, y, 10 * s, 0, Math.PI * 2);
    ctx.arc(x + 24 * s, y - 4 * s, 14 * s, 0, Math.PI * 2);
    ctx.arc(x + 40 * s, y, 10 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  // 清除缓存
  static clearCache() {
    this.spriteCache.clear();
  }
}
