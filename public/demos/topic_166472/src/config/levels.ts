import type { LevelConfig } from '@/types/game';

export const LEVELS: LevelConfig[] = [
  {
    name: '星域初探',
    rows: 4,
    cols: 8,
    ballSpeedMultiplier: 1.0,
    paddleWidthScale: 1.0,
    brickPattern: [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
    ],
  },
  {
    name: '星云堡垒',
    rows: 5,
    cols: 9,
    ballSpeedMultiplier: 1.15,
    paddleWidthScale: 0.92,
    brickPattern: [
      [2, 1, 1, 1, 2, 1, 1, 1, 2],
      [1, 2, 1, 1, 1, 1, 1, 2, 1],
      [1, 1, 2, 1, 1, 1, 2, 1, 1],
      [1, 2, 1, 1, 1, 1, 1, 2, 1],
      [2, 1, 1, 1, 2, 1, 1, 1, 2],
    ],
  },
  {
    name: '终极黑洞',
    rows: 6,
    cols: 10,
    ballSpeedMultiplier: 1.3,
    paddleWidthScale: 0.85,
    brickPattern: [
      [0, 0, 0, 0, 3, 3, 0, 0, 0, 0],
      [0, 0, 0, 2, 2, 2, 2, 0, 0, 0],
      [0, 0, 2, 1, 1, 1, 1, 2, 0, 0],
      [0, 2, 1, 1, 1, 1, 1, 1, 2, 0],
      [2, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
  },
];

export const BRICK_COLORS: Record<number, { fill: string; glow: string; points: number }> = {
  1: { fill: '#00f5ff', glow: 'rgba(0, 245, 255, 0.6)', points: 10 },
  2: { fill: '#ffcc00', glow: 'rgba(255, 204, 0, 0.6)', points: 25 },
  3: { fill: '#ff00e5', glow: 'rgba(255, 0, 229, 0.6)', points: 50 },
};

export const ROW_GRADIENT_OFFSETS = [
  { h: 0 },
  { h: 25 },
  { h: 55 },
  { h: 160 },
  { h: 200 },
  { h: 280 },
];
