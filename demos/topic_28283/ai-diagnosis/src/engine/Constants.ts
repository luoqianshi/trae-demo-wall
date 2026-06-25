// 画布和瓦片
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 480;
export const TILE_SIZE = 32;
export const GRAVITY = 0.6;
export const MAX_FALL_SPEED = 12;
export const JUMP_FORCE = -11;
export const PLAYER_SPEED = 3;
export const PLAYER_RUN_SPEED = 5;
export const PLAYER_ACCELERATION = 0.8;
export const PLAYER_AIR_ACCELERATION = 0.4;
export const FRICTION = 0.85;
export const GROUND_FRICTION = 0.9;

// 瓦片类型
export const TILE = {
  EMPTY: 0,
  GROUND: 1,
  BRICK: 2,
  QUESTION_BLOCK: 3,
  USED_BLOCK: 4,
  PIPE_TL: 5,
  PIPE_TR: 6,
  PIPE_BL: 7,
  PIPE_BR: 8,
  FLAG_POLE: 9,
  FLAG_TOP: 10,
  HARD_BLOCK: 11,
  INVISIBLE_BLOCK: 12,
} as const;

// 游戏状态
export const GAME_STATE = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
  LEVEL_COMPLETE: 'level_complete',
  WIN: 'win',
} as const;

// 玩家状态
export const PLAYER_STATE = {
  SMALL: 'small',
  BIG: 'big',
  FIRE: 'fire',
  DEAD: 'dead',
} as const;

// 方向
export const DIRECTION = {
  LEFT: -1,
  RIGHT: 1,
} as const;

// 颜色
export const COLORS = {
  SKY: '#5C94FC',
  GROUND: '#C84C0C',
  GROUND_DARK: '#A0380C',
  BRICK: '#C84C0C',
  BRICK_DARK: '#A0380C',
  QUESTION: '#FCA044',
  QUESTION_DARK: '#E08030',
  PIPE_GREEN: '#00A800',
  PIPE_GREEN_DARK: '#008000',
  PIPE_GREEN_LIGHT: '#20C820',
  MARIO_RED: '#E52521',
  MARIO_SKIN: '#FCA044',
  MARIO_BROWN: '#AC7C00',
  GOOMBA_BROWN: '#C84C0C',
  KOOPA_GREEN: '#00A800',
  COIN_GOLD: '#FCA044',
  COIN_DARK: '#E08030',
  FLAG_GREEN: '#00A800',
  WHITE: '#FCFCFC',
  BLACK: '#000000',
  MUSHROOM_RED: '#E52521',
  STAR_YELLOW: '#FCA044',
  USED_BLOCK: '#888888',
};
