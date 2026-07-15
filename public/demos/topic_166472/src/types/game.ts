export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  trail: Array<{ x: number; y: number }>;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

export interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  glowColor: string;
  points: number;
  hits: number;
  maxHits: number;
  visible: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

export type GameStatus = 'menu' | 'playing' | 'paused' | 'won' | 'lost' | 'levelUp';

export interface LevelConfig {
  rows: number;
  cols: number;
  brickPattern: number[][];
  ballSpeedMultiplier: number;
  paddleWidthScale: number;
  name: string;
}

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const PADDLE_HEIGHT = 14;
export const PADDLE_BASE_WIDTH = 120;
export const BALL_RADIUS = 8;
export const BALL_BASE_SPEED = 5;
export const BRICK_PADDING = 6;
export const BRICK_OFFSET_TOP = 80;
export const BRICK_OFFSET_LEFT = 40;
export const BRICK_HEIGHT = 24;
export const INITIAL_LIVES = 3;
