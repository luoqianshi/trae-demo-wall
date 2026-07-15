import type { Ball, Paddle, Brick } from '@/types/game';

export const rectBallCollision = (
  rect: { x: number; y: number; width: number; height: number },
  ball: Ball
): { hit: boolean; side: 'top' | 'bottom' | 'left' | 'right' | null } => {
  const closestX = Math.max(rect.x, Math.min(ball.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(ball.y, rect.y + rect.height));
  const dx = ball.x - closestX;
  const dy = ball.y - closestY;
  const distSq = dx * dx + dy * dy;

  if (distSq > ball.radius * ball.radius) {
    return { hit: false, side: null };
  }

  const ballCenterX = ball.x;
  const ballCenterY = ball.y;
  const rectCenterX = rect.x + rect.width / 2;
  const rectCenterY = rect.y + rect.height / 2;

  const dx2 = ballCenterX - rectCenterX;
  const dy2 = ballCenterY - rectCenterY;
  const widthHalf = rect.width / 2 + ball.radius;
  const heightHalf = rect.height / 2 + ball.radius;

  const crossWidth = widthHalf * dy2;
  const crossHeight = heightHalf * dx2;

  let side: 'top' | 'bottom' | 'left' | 'right' | null = null;
  if (Math.abs(dx2) <= widthHalf && Math.abs(dy2) <= heightHalf) {
    if (crossWidth > crossHeight) {
      side = crossWidth > -crossHeight ? 'bottom' : 'left';
    } else {
      side = crossWidth > -crossHeight ? 'right' : 'top';
    }
  }

  return { hit: true, side };
};

export const paddleBallCollision = (paddle: Paddle, ball: Ball): number | null => {
  const col = rectBallCollision(paddle, ball);
  if (!col.hit) return null;
  const hitPos = (ball.x - paddle.x) / paddle.width;
  return Math.max(-0.5, Math.min(0.5, hitPos - 0.5));
};

export const allBricksCleared = (bricks: Brick[]): boolean => {
  return bricks.every((b) => !b.visible);
};
