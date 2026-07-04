/* =================================================================
   CodeBeat 节奏编程 - 粒子系统（2D 背景 + 命中爆破）
   ================================================================= */

// ============ 背景浮动粒子 ============
const particles = [];
const PARTICLE_COUNT = 60;

function initParticles() {
  particles.length = 0;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(Math.random() * 0.4 + 0.1),
      size: Math.random() * 4 + 2,
      color: Object.values(NOTE_COLORS)[Math.floor(Math.random() * 4)],
      alpha: Math.random() * 0.5 + 0.2,
    });
  }
}

function resizeBgCanvas() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}

function updateParticles() {
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.y < -10) { p.y = bgCanvas.height + 10; p.x = Math.random() * bgCanvas.width; }
    if (p.x < -10) p.x = bgCanvas.width + 10;
    if (p.x > bgCanvas.width + 10) p.x = -10;
  }
}

function drawParticles() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  for (const p of particles) {
    // 拖尾
    const tailLen = p.size * 5;
    const tailX = p.x - p.vx * tailLen;
    const tailY = p.y - p.vy * tailLen;
    const gradient = bgCtx.createLinearGradient(p.x, p.y, tailX, tailY);
    gradient.addColorStop(0, p.color);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    bgCtx.beginPath();
    bgCtx.moveTo(p.x, p.y);
    bgCtx.lineTo(tailX, tailY);
    bgCtx.strokeStyle = gradient;
    bgCtx.lineWidth = p.size;
    bgCtx.lineCap = 'round';
    bgCtx.globalAlpha = p.alpha;
    bgCtx.stroke();

    // 粒子本体
    bgCtx.beginPath();
    bgCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    bgCtx.fillStyle = p.color;
    bgCtx.shadowColor = p.color;
    bgCtx.shadowBlur = 6;
    bgCtx.fill();
    bgCtx.shadowBlur = 0;
  }
  bgCtx.globalAlpha = 1;
}

// ============ 命中粒子爆破 ============
const hitParticles = [];
const judgeHitPositions = {};

function cacheJudgeHitPositions() {
  for (const trackKey of trackKeys) {
    const trackEl = trackContainers[trackKey];
    if (!trackEl) continue;

    const rect = trackEl.getBoundingClientRect();
    judgeHitPositions[trackKey] = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height * getJudgeLineRatio(),
    };
  }
}

/** 在判定线位置生成命中粒子 */
function spawnHitParticles(trackKey, color) {
  if (!judgeHitPositions[trackKey]) {
    cacheJudgeHitPositions();
  }

  const point = judgeHitPositions[trackKey];
  if (!point) return;

  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 / 12) * i + Math.random() * 0.3;
    const speed = 2 + Math.random() * 4;
    hitParticles.push({
      x: point.x,
      y: point.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      size: 2 + Math.random() * 3,
      color: color,
      alpha: 1,
      life: 0.6 + Math.random() * 0.3,
      age: 0,
    });
  }
}

function updateHitParticles(dt) {
  for (let i = hitParticles.length - 1; i >= 0; i--) {
    const p = hitParticles[i];
    p.age += dt;
    if (p.age >= p.life) {
      hitParticles.splice(i, 1);
      continue;
    }
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1;
    p.alpha = 1 - (p.age / p.life);
    p.size *= 0.97;
  }
}

function drawHitParticles() {
  for (const p of hitParticles) {
    bgCtx.beginPath();
    bgCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    bgCtx.fillStyle = p.color;
    bgCtx.globalAlpha = p.alpha * 0.8;
    bgCtx.shadowColor = p.color;
    bgCtx.shadowBlur = 8;
    bgCtx.fill();
    bgCtx.shadowBlur = 0;
  }
  bgCtx.globalAlpha = 1;
}
